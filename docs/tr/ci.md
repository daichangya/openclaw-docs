---
read_when:
    - Bir CI işinin neden çalıştığını veya neden çalışmadığını anlamanız gerekir.
    - Başarısız GitHub Actions kontrollerinde hata ayıklıyorsunuz.
summary: CI iş grafiği, kapsam geçitleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-04-23T13:58:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5a8ea0d8e428826169b0e6aced1caeb993106fe79904002125ace86b48cae1f
    source_path: ci.md
    workflow: 15
---

# CI İşlem Hattı

CI, `main` dalına yapılan her push işleminde ve her pull request'te çalışır. Yalnızca ilgisiz alanlar değiştiğinde pahalı işleri atlamak için akıllı kapsamlandırma kullanır.

QA Lab, ana akıllı kapsamlı iş akışının dışında özel CI hatlarına sahiptir. `Parity gate` iş akışı, eşleşen PR değişikliklerinde ve manuel tetikleme ile çalışır; özel QA çalışma zamanını derler ve sahte GPT-5.4 ile Opus 4.6 etmen paketlerini karşılaştırır. `QA-Lab - All Lanes` iş akışı, `main` üzerinde gecelik olarak ve manuel tetikleme ile çalışır; sahte parity gate, canlı Matrix hattı ve canlı Telegram hattını paralel işler olarak dağıtır. Canlı işler `qa-live-shared` environment'ını kullanır ve Telegram hattı Convex kiralamalarını kullanır. `OpenClaw Release Checks` de sürüm onayından önce aynı QA Lab hatlarını çalıştırır.

## İş Genel Görünümü

| İş                               | Amaç                                                                                         | Ne zaman çalışır                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen eklentileri algılar ve CI manifestini oluşturur | Taslak olmayan push ve PR'lerde her zaman |
| `security-scm-fast`              | `zizmor` aracılığıyla özel anahtar algılama ve iş akışı denetimi                             | Taslak olmayan push ve PR'lerde her zaman |
| `security-dependency-audit`      | npm advisory'lerine karşı bağımlılıksız üretim lockfile denetimi                             | Taslak olmayan push ve PR'lerde her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için zorunlu toplu iş                                                  | Taslak olmayan push ve PR'lerde her zaman |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş artifact kontrolleri ve yeniden kullanılabilir aşağı akış artifact'lerini derler | Node ile ilgili değişiklikler       |
| `checks-fast-core`               | bundled/plugin-contract/protocol kontrolleri gibi hızlı Linux doğruluk hatları               | Node ile ilgili değişiklikler       |
| `checks-fast-contracts-channels` | Kararlı bir toplu kontrol sonucu ile shard'lanmış kanal sözleşme kontrolleri                 | Node ile ilgili değişiklikler       |
| `checks-node-extensions`         | eklenti paketi genelinde tam bundled-plugin test shard'ları                                  | Node ile ilgili değişiklikler       |
| `checks-node-core-test`          | kanal, bundled, contract ve eklenti hatları hariç çekirdek Node test shard'ları             | Node ile ilgili değişiklikler       |
| `extension-fast`                 | Yalnızca değişen bundled plugin'ler için odaklı testler                                      | eklenti değişiklikleri olan pull request'ler |
| `check`                          | shard'lanmış ana yerel geçit eşdeğeri: prod türleri, lint, guard'lar, test türleri ve katı smoke | Node ile ilgili değişiklikler       |
| `check-additional`               | Mimari, sınır, eklenti yüzeyi guard'ları, package-boundary ve gateway-watch shard'ları       | Node ile ilgili değişiklikler       |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke testi                                | Node ile ilgili değişiklikler       |
| `checks`                         | Derlenmiş artifact kanal testleri artı yalnızca push için Node 22 uyumluluğu doğrulayıcısı  | Node ile ilgili değişiklikler       |
| `check-docs`                     | Dokümantasyon biçimlendirme, lint ve bozuk bağlantı kontrolleri                              | Dokümantasyon değiştiğinde          |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                    | Python skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows'a özgü test hatları                                                                   | Windows ile ilgili değişiklikler    |
| `macos-node`                     | Paylaşılan derlenmiş artifact'leri kullanan macOS TypeScript test hattı                      | macOS ile ilgili değişiklikler      |
| `macos-swift`                    | macOS uygulaması için Swift lint, build ve testler                                           | macOS ile ilgili değişiklikler      |
| `android`                        | Her iki flavor için Android birim testleri artı bir debug APK build'i                        | Android ile ilgili değişiklikler    |

## Önce Hızlı Başarısız Olma Sırası

İşler, pahalı işler çalışmadan önce ucuz kontroller başarısız olacak şekilde sıralanır:

1. `preflight`, hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bağımsız işler değil, bu işin içindeki adımlardır.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matris işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla çakışacak şekilde çalışır, böylece aşağı akış tüketicileri paylaşılan build hazır olur olmaz başlayabilir.
4. Daha ağır platform ve çalışma zamanı hatları bundan sonra dağıtılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, yalnızca PR için `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testleriyle kapsanır.
CI iş akışı düzenlemeleri Node CI grafiğini ve iş akışı lint denetimini doğrular, ancak tek başına Windows, Android veya macOS yerel build'lerini zorlamaz; bu platform hatları platform kaynak değişikliklerine göre kapsamlı kalır.
Windows Node kontrolleri, Windows'a özgü işlem/yol sarmalayıcılarına, npm/pnpm/UI çalıştırıcı yardımcılarına, paket yöneticisi yapılandırmasına ve bu hattı çalıştıran CI iş akışı yüzeylerine göre kapsamlandırılır; ilgisiz kaynak, eklenti, install-smoke ve yalnızca test değişiklikleri Linux Node hatlarında kalır, böylece normal test shard'ları tarafından zaten kullanılan kapsam için 16-vCPU'lu bir Windows worker ayrılmaz.
Ayrı `install-smoke` iş akışı aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. `run_install_smoke` değerini daha dar changed-smoke sinyalinden hesaplar; böylece Docker/install smoke, kurulum, paketleme, container ile ilgili değişiklikler, bundled extension üretim değişiklikleri ve Docker smoke işlerinin kullandığı çekirdek plugin/channel/gateway/Plugin SDK yüzeyleri için çalışır. Yalnızca test ve yalnızca dokümantasyon düzenlemeleri Docker worker'ları ayırmaz. QR paket smoke testi, Docker `pnpm install` katmanını yeniden çalışmaya zorlar ve BuildKit pnpm store önbelleğini korur; böylece her çalıştırmada bağımlılıkları yeniden indirmeden kurulumu yine de test eder. gateway-network e2e, işin başında oluşturulan çalışma zamanı imajını yeniden kullanır; böylece başka bir Docker build eklemeden gerçek container-to-container WebSocket kapsamı ekler. Yerel `test:docker:all`, paylaşılan bir canlı test imajını ve paylaşılan bir `scripts/e2e/Dockerfile` built-app imajını önceden derler, ardından canlı/E2E smoke hatlarını `OPENCLAW_SKIP_DOCKER_BUILD=1` ile paralel çalıştırır; varsayılan 4 eşzamanlılığını `OPENCLAW_DOCKER_ALL_PARALLELISM` ile ayarlayın. Yerel toplu çalıştırma, varsayılan olarak ilk başarısızlıktan sonra yeni havuzlanmış hatları zamanlamayı durdurur ve her hattın `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık bir zaman aşımı vardır. Başlangıca veya sağlayıcıya duyarlı hatlar paralel havuzdan sonra özel olarak çalışır. Yeniden kullanılabilir canlı/E2E iş akışı, Docker matrisinden önce SHA etiketli tek bir GHCR Docker E2E imajı oluşturup göndererek paylaşılan imaj modelini yansıtır, ardından matrisi `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır. Zamanlanmış canlı/E2E iş akışı, tam sürüm yolundaki Docker paketini her gün çalıştırır. QR ve yükleyici Docker testleri kendi kurulum odaklı Dockerfile'larını korur. Ayrı bir `docker-e2e-fast` işi, 120 saniyelik komut zaman aşımı altında sınırlı bundled-plugin Docker profilini çalıştırır: setup-entry bağımlılık onarımı artı sentetik bundled-loader başarısızlık izolasyonu. Tam bundled update/channel matrisi manuel/tam paket olarak kalır çünkü tekrar eden gerçek npm update ve doctor repair geçişleri yapar.

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından çalıştırılır. Bu yerel geçit, geniş CI platform kapsamına kıyasla mimari sınırlar konusunda daha katıdır: çekirdek üretim değişiklikleri çekirdek prod typecheck artı çekirdek testlerini çalıştırır, çekirdek yalnızca test değişiklikleri yalnızca çekirdek test typecheck/testlerini çalıştırır, eklenti üretim değişiklikleri eklenti prod typecheck artı eklenti testlerini çalıştırır ve eklenti yalnızca test değişiklikleri yalnızca eklenti test typecheck/testlerini çalıştırır. Herkese açık Plugin SDK veya plugin-contract değişiklikleri, eklenti doğrulamasını genişletir çünkü eklentiler bu çekirdek sözleşmelere bağımlıdır. Yalnızca sürüm metaverisi içeren version bump'ları hedefli sürüm/yapılandırma/kök bağımlılık kontrollerini çalıştırır. Bilinmeyen root/config değişiklikleri güvenli olacak şekilde tüm hatlara başarısız olur.

Push işlemlerinde `checks` matrisi yalnızca push için olan `compat-node22` hattını ekler. Pull request'lerde bu hat atlanır ve matris normal test/kanal hatlarına odaklı kalır.

En yavaş Node test aileleri, her iş küçük kalsın diye bölünür veya dengelenir: kanal sözleşmeleri, registry ve çekirdek kapsamı toplam altı ağırlıklı shard'a böler, bundled plugin testleri altı eklenti worker'ı arasında dengelenir, auto-reply altı küçük worker yerine üç dengeli worker olarak çalışır ve agentic gateway/plugin yapılandırmaları derlenmiş artifact'leri beklemek yerine mevcut yalnızca kaynak agentic Node işlerine dağıtılır. Geniş browser, QA, medya ve çeşitli eklenti testleri, paylaşılan eklenti genel amaçlı yapılandırma yerine özel Vitest yapılandırmalarını kullanır. Geniş agents hattı, tek bir yavaş test dosyasına ait olmak yerine import/zamanlama ağırlıklı olduğu için paylaşılan Vitest dosya-paralel zamanlayıcısını kullanır. `runtime-config`, paylaşılan çalışma zamanı shard'ının kuyruğun sonunu sahiplenmesini önlemek için infra core-runtime shard'ı ile çalışır. `check-additional`, package-boundary derleme/canary işlerini birlikte tutar ve çalışma zamanı topolojisi mimarisini gateway watch kapsamından ayırır; boundary guard shard'ı küçük bağımsız guard'larını tek bir iş içinde eşzamanlı çalıştırır. Gateway watch, kanal testleri ve çekirdek support-boundary shard'ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır; böylece iki ek Blacksmith worker'ı ve ikinci bir artifact-consumer kuyruğu oluşturmadan eski kontrol adlarını hafif doğrulayıcı işler olarak korur.
Android CI, hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır, ardından Play debug APK'sını derler. third-party flavor için ayrı bir kaynak kümesi veya manifest yoktur; birim test hattı yine de bu flavor'ı SMS/call-log BuildConfig bayraklarıyla derler, aynı zamanda Android ile ilgili her push'ta yinelenen bir debug APK paketleme işinden kaçınır.
`extension-fast` yalnızca PR içindir çünkü push çalıştırmaları zaten tam bundled plugin shard'larını yürütür. Bu, `checks-node-extensions` içinde zaten bulunan kapsam için `main` üzerinde ek bir Blacksmith worker ayırmadan incelemeler için değişen eklenti geri bildirimi sağlar.

GitHub, aynı PR veya `main` referansına daha yeni bir push geldiğinde yerini alan işleri `cancelled` olarak işaretleyebilir. Aynı referans için en yeni çalıştırma da başarısız olmuyorsa bunu CI gürültüsü olarak değerlendirin. Toplu shard kontrolleri `!cancelled() && always()` kullanır, böylece normal shard hatalarını yine bildirirler ancak tüm iş akışı zaten yerini almışsa kuyruğa girmezler.
CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`); böylece eski bir kuyruk grubundaki GitHub taraflı bir zombi, daha yeni main çalıştırmalarını süresiz olarak engelleyemez.

## Çalıştırıcılar

| Çalıştırıcı                      | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplu işler (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protocol/contract/bundled kontrolleri, shard'lanmış kanal sözleşme kontrolleri, lint dışındaki `check` shard'ları, `check-additional` shard'ları ve toplu işleri, Node test toplu doğrulayıcıları, dokümantasyon kontrolleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight da GitHub barındırmalı Ubuntu kullanır, böylece Blacksmith matrisi daha erken kuyruğa girebilir |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shard'ları, bundled plugin test shard'ları, `android`                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`; bu iş hâlâ CPU'ya yeterince duyarlıdır ve 8 vCPU tasarruf ettirdiğinden daha fazla maliyet yaratmıştır; install-smoke Docker build'leri, burada 32-vCPU kuyruk süresi tasarruf ettirdiğinden daha fazla maliyet yaratmıştır                                                                                                                                                                                                                                |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                                    |

## Yerel Eşdeğerler

```bash
pnpm changed:lanes   # origin/main...HEAD için yerel changed-lane sınıflandırıcısını inceleyin
pnpm check:changed   # akıllı yerel geçit: sınır hattına göre değişen typecheck/lint/testler
pnpm check          # hızlı yerel geçit: production tsgo + shard'lanmış lint + paralel hızlı guard'lar
pnpm check:test-types
pnpm check:timed    # aşama başına zamanlamalarla aynı geçit
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest testleri
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # dokümantasyon biçimlendirme + lint + bozuk bağlantılar
pnpm build          # CI artifact/build-smoke hatları önemliyse dist build'i
node scripts/ci-run-timings.mjs <run-id>  # toplam süreyi, kuyruk süresini ve en yavaş işleri özetleyin
```
