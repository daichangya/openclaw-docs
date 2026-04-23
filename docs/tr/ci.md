---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekiyor.
    - Başarısız GitHub Actions kontrollerinde hata ayıklıyorsunuz.
summary: CI iş grafiği, kapsam geçitleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-04-23T08:58:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89c66204b203a39435cfc19de7b437867f2792bbfa2c3948371abde9f80e11
    source_path: ci.md
    workflow: 15
---

# CI İşlem Hattı

CI, `main` dalına yapılan her push işleminde ve her pull request'te çalışır. Yalnızca ilgisiz alanlar değiştiğinde pahalı işleri atlamak için akıllı kapsamlandırma kullanır.

QA Lab, ana akıllı kapsamlı iş akışının dışında özel CI şeritlerine sahiptir.
`Parity gate` iş akışı, eşleşen PR değişikliklerinde ve manuel tetiklemede çalışır;
özel QA çalışma zamanını derler ve sahte GPT-5.4 ile Opus 4.6
agentic paketlerini karşılaştırır. `QA-Lab - All Lanes` iş akışı, `main` üzerinde gece çalışır ve
manuel tetiklemede de çalışır; sahte parity gate, canlı Matrix şeridi ve canlı
Telegram şeridini paralel işler olarak dağıtır. Canlı işler `qa-live-shared`
ortamını kullanır ve Telegram şeridi Convex lease'leri kullanır. `OpenClaw Release
Checks` de sürüm onayından önce aynı QA Lab şeritlerini çalıştırır.

## İş Genel Bakışı

| İş                               | Amaç                                                                                         | Ne zaman çalışır                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Yalnızca docs değişikliklerini, değişen kapsamları, değişen extension'ları algılar ve CI manifest'ini oluşturur | Taslak olmayan push ve PR'lerde her zaman |
| `security-scm-fast`              | `zizmor` ile özel anahtar algılama ve iş akışı denetimi                                     | Taslak olmayan push ve PR'lerde her zaman |
| `security-dependency-audit`      | npm advisories'e karşı bağımlılıksız üretim lockfile denetimi                               | Taslak olmayan push ve PR'lerde her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için zorunlu toplu iş                                                 | Taslak olmayan push ve PR'lerde her zaman |
| `build-artifacts`                | `dist/`, Control UI, yerleşik artifact kontrolleri ve yeniden kullanılabilir downstream artifact'leri derler | Node ile ilgili değişiklikler       |
| `checks-fast-core`               | paketle gelen/plugin-contract/protocol kontrolleri gibi hızlı Linux doğruluk şeritleri      | Node ile ilgili değişiklikler       |
| `checks-fast-contracts-channels` | Kararlı bir toplu kontrol sonucuyla shard'lanmış kanal sözleşmesi kontrolleri               | Node ile ilgili değişiklikler       |
| `checks-node-extensions`         | extension paketi genelinde tam paketle gelen Plugin test shard'ları                         | Node ile ilgili değişiklikler       |
| `checks-node-core-test`          | Kanal, paketle gelen, sözleşme ve extension şeritleri hariç çekirdek Node test shard'ları   | Node ile ilgili değişiklikler       |
| `extension-fast`                 | Yalnızca değişen paketle gelen Plugin'ler için odaklı testler                               | extension değişiklikli pull request'ler |
| `check`                          | Parçalanmış ana yerel geçit eşdeğeri: prod türleri, lint, guard'lar, test türleri ve katı smoke | Node ile ilgili değişiklikler       |
| `check-additional`               | Mimari, sınır, extension-surface guard'ları, package-boundary ve gateway-watch shard'ları   | Node ile ilgili değişiklikler       |
| `build-smoke`                    | Yerleşik CLI smoke testleri ve başlangıç belleği smoke testi                                | Node ile ilgili değişiklikler       |
| `checks`                         | Yerleşik artifact kanal testleri ile yalnızca push için Node 22 uyumluluğu doğrulayıcısı    | Node ile ilgili değişiklikler       |
| `check-docs`                     | Docs biçimlendirme, lint ve bozuk bağlantı kontrolleri                                      | Docs değiştiğinde                   |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                   | Python-skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows'a özel test şeritleri                                                               | Windows ile ilgili değişiklikler    |
| `macos-node`                     | Paylaşılan yerleşik artifact'leri kullanan macOS TypeScript test şeridi                     | macOS ile ilgili değişiklikler      |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                        | macOS ile ilgili değişiklikler      |
| `android`                        | Her iki flavor için Android birim testleri artı bir debug APK derlemesi                     | Android ile ilgili değişiklikler    |

## Hızlı Başarısız Olma Sırası

İşler, pahalı olanlar çalışmadan önce ucuz kontroller başarısız olacak şekilde sıralanır:

1. `preflight`, hangi şeritlerin var olacağına en başta karar verir. `docs-scope` ve `changed-scope` mantığı bağımsız işler değil, bu işin içindeki adımlardır.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matris işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux şeritleriyle çakışacak şekilde çalışır; böylece downstream tüketiciler paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve çalışma zamanı şeritleri bundan sonra dağıtılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, yalnızca PR için `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde yer alır ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testleriyle kapsanır.
CI iş akışı düzenlemeleri Node CI grafiğini ve iş akışı lint'ini doğrular, ancak tek başlarına Windows, Android veya macOS yerel derlemelerini zorlamaz; bu platform şeritleri platform kaynak değişikliklerine göre kapsamlandırılmış kalır.
Windows Node kontrolleri; Windows'a özgü süreç/yol sarmalayıcıları, npm/pnpm/UI runner yardımcıları, package manager yapılandırması ve bu şeridi çalıştıran CI iş akışı yüzeyleriyle kapsamlandırılır; ilgisiz kaynak, Plugin, install-smoke ve yalnızca test değişiklikleri normal test shard'ları tarafından zaten çalıştırılan kapsam için 16-vCPU'lu bir Windows worker ayırmamak adına Linux Node şeritlerinde kalır.
Ayrı `install-smoke` iş akışı, kendi `preflight` işi üzerinden aynı kapsam betiğini yeniden kullanır. Daha dar changed-smoke sinyalinden `run_install_smoke` değerini hesaplar; böylece Docker/install smoke, install, paketleme, container ile ilgili değişiklikler, paketle gelen extension üretim değişiklikleri ve Docker smoke işlerinin çalıştırdığı çekirdek Plugin/kanal/gateway/Plugin SDK yüzeyleri için çalışır. Yalnızca test ve yalnızca docs düzenlemeleri Docker worker'larını ayırmaz. QR paket smoke testi, BuildKit pnpm store önbelleğini korurken Docker `pnpm install` katmanını yeniden çalışmaya zorlar; böylece her çalıştırmada bağımlılıkları yeniden indirmeden kurulumu yine de test eder. Gateway-network e2e, işin başında daha önce derlenmiş çalışma zamanı imajını yeniden kullanır; böylece bir Docker derlemesi daha eklemeden gerçek container-container WebSocket kapsamı ekler. Yerel `test:docker:all`, paylaşılan tek bir `scripts/e2e/Dockerfile` built-app imajını önceden derler ve bunu E2E container smoke runner'ları arasında yeniden kullanır; yeniden kullanılabilir canlı/E2E iş akışı da Docker matrisi öncesinde tek bir SHA etiketli GHCR Docker E2E imajı derleyip göndererek ve ardından matrisi `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırarak bu deseni yansıtır. QR ve installer Docker testleri kendi kuruluma odaklı Dockerfile'larını korur. Ayrı bir `docker-e2e-fast` işi, sınırlandırılmış paketle gelen Plugin Docker profilini 120 saniyelik komut zaman aşımı altında çalıştırır: setup-entry bağımlılık onarımı artı sentetik bundled-loader arıza yalıtımı. Tam paketle gelen güncelleme/kanal matrisi manuel/tam paket olarak kalır; çünkü gerçek npm update ve doctor repair geçişlerini tekrar tekrar uygular.

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde yer alır ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel geçit, geniş CI platform kapsamına göre mimari sınırlar konusunda daha katıdır: çekirdek üretim değişiklikleri çekirdek prod typecheck artı çekirdek testlerini çalıştırır, yalnızca çekirdek test değişiklikleri yalnızca çekirdek test typecheck/testlerini çalıştırır, extension üretim değişiklikleri extension prod typecheck artı extension testlerini çalıştırır ve yalnızca extension test değişiklikleri yalnızca extension test typecheck/testlerini çalıştırır. Herkese açık Plugin SDK veya plugin-contract değişiklikleri, extension'lar bu çekirdek sözleşmelere bağlı olduğu için extension doğrulamasını genişletir. Yalnızca sürüm meta verisi içeren version bump'lar hedefli sürüm/yapılandırma/kök bağımlılık kontrolleri çalıştırır. Bilinmeyen kök/yapılandırma değişiklikleri güvenli tarafta kalmak için tüm şeritlere başarısız olur.

Push işlemlerinde `checks` matrisi yalnızca push için `compat-node22` şeridini ekler. Pull request'lerde bu şerit atlanır ve matris normal test/kanal şeritlerine odaklı kalır.

En yavaş Node test aileleri, her iş küçük kalacak şekilde bölünür veya dengelenir: kanal sözleşmeleri kayıt ve çekirdek kapsamını toplam altı ağırlıklı shard'a böler, paketle gelen Plugin testleri altı extension worker arasında dengelenir, auto-reply altı küçük worker yerine üç dengeli worker olarak çalışır ve agentic gateway/plugin yapılandırmaları yerleşik artifact'leri beklemek yerine mevcut yalnızca kaynak agentic Node işlerine dağıtılır. Geniş tarayıcı, QA, medya ve çeşitli Plugin testleri paylaşılan plugin catch-all yerine kendilerine özel Vitest yapılandırmalarını kullanır. Geniş agents şeridi, tek bir yavaş test dosyasına ait olmaktan çok import/zamanlama ağırlıklı olduğu için paylaşılan Vitest dosya paralel zamanlayıcısını kullanır. `runtime-config`, paylaşılan çalışma zamanı shard'ının kuyruğu sahiplenmesini önlemek için infra core-runtime shard'ı ile birlikte çalışır. `check-additional`, package-boundary derleme/canary işlerini birlikte tutar ve çalışma zamanı topolojisi mimarisini gateway watch kapsamından ayırır; boundary guard shard'ı küçük bağımsız guard'larını tek iş içinde eşzamanlı çalıştırır. Gateway watch, kanal testleri ve çekirdek support-boundary shard'ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır; eski kontrol adlarını hafif doğrulayıcı işler olarak korurken iki ek Blacksmith worker'ı ve ikinci bir artifact-consumer kuyruğunu önler.
Android CI, hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır, ardından Play debug APK'sını derler. Third-party flavor'ın ayrı bir kaynak kümesi veya manifest'i yoktur; birim test şeridi yine de bu flavor'ı SMS/call-log BuildConfig bayraklarıyla derlerken her Android ile ilgili push'ta yinelenen bir debug APK paketleme işinden kaçınır.
`extension-fast` yalnızca PR içindir; çünkü push çalıştırmaları zaten tam paketle gelen Plugin shard'larını yürütür. Bu, `main` üzerinde `checks-node-extensions` içinde zaten bulunan kapsam için ek bir Blacksmith worker ayırmadan incelemeler için değişen Plugin geri bildirimi sağlar.

GitHub, aynı PR veya `main` referansına daha yeni bir push geldiğinde yerine geçen işleri `cancelled` olarak işaretleyebilir. Aynı referans için en yeni çalışma da başarısız olmadığı sürece bunu CI gürültüsü olarak değerlendirin. Toplu shard kontrolleri `!cancelled() && always()` kullanır; böylece normal shard arızalarını yine de raporlarlar ancak tüm iş akışı zaten yerini yenisine bıraktıktan sonra kuyruğa girmezler.
CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`); böylece eski bir kuyruk grubundaki GitHub tarafı zombi bir iş, daha yeni main çalıştırmalarını süresiz olarak engelleyemez.

## Runner'lar

| Runner                           | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplamaları (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protocol/contract/paketle gelen kontroller, shard'lanmış kanal sözleşmesi kontrolleri, lint dışındaki `check` shard'ları, `check-additional` shard'ları ve toplamaları, Node test toplu doğrulayıcıları, docs kontrolleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight da GitHub tarafından barındırılan Ubuntu kullanır, böylece Blacksmith matrisi daha erken kuyruğa girebilir |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shard'ları, paketle gelen Plugin test shard'ları, `android`                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`; bu iş CPU'ya yeterince duyarlı kaldığından 8 vCPU tasarruf ettiğinden daha fazlasına mal oldu; 32-vCPU kuyruk süresi tasarruf ettiğinden daha pahalı olduğu için install-smoke Docker derlemeleri                                                                                                                                                                                                                                                        |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork'lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork'lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                                  |

## Yerel Eşdeğerler

```bash
pnpm changed:lanes   # origin/main...HEAD için yerel changed-lane sınıflandırıcısını inceleyin
pnpm check:changed   # akıllı yerel geçit: sınır şeridine göre changed typecheck/lint/testler
pnpm check          # hızlı yerel geçit: üretim tsgo + shard'lanmış lint + paralel hızlı guard'lar
pnpm check:test-types
pnpm check:timed    # aynı geçit, aşama başına zamanlamalarla
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest testleri
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # docs biçimlendirme + lint + bozuk bağlantılar
pnpm build          # CI artifact/build-smoke şeritleri önemliyse dist derlemesi
node scripts/ci-run-timings.mjs <run-id>  # duvar süresini, kuyruk süresini ve en yavaş işleri özetler
```
