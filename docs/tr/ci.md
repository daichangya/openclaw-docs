---
read_when:
    - Bir CI işinin neden çalıştığını veya neden çalışmadığını anlamanız gerekir
    - Başarısız GitHub Actions kontrollerinde hata ayıklıyorsunuz
summary: CI iş grafiği, kapsam geçitleri ve yerel komut eşdeğerleri
title: CI İşlem Hattı
x-i18n:
    generated_at: "2026-04-23T14:56:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9a03440ae28a15167fc08d9c66bb1fd719ddfa1517aaecb119c80f2ad826c0d
    source_path: ci.md
    workflow: 15
---

# CI İşlem Hattı

CI, `main` dalına yapılan her push ve her pull request için çalışır. Yalnızca ilgisiz alanlar değiştiğinde pahalı işleri atlamak için akıllı kapsamlandırma kullanır.

QA Lab, ana akıllı kapsamlı iş akışının dışında ayrılmış CI şeritlerine sahiptir. `Parity gate` iş akışı, eşleşen PR değişikliklerinde ve manuel tetiklemede çalışır; özel QA çalışma zamanını derler ve sahte GPT-5.4 ile Opus 4.6 agentic paketlerini karşılaştırır. `QA-Lab - All Lanes` iş akışı, `main` üzerinde geceleri ve manuel tetiklemede çalışır; sahte parity gate, canlı Matrix şeridi ve canlı Telegram şeridini paralel işler olarak dağıtır. Canlı işler `qa-live-shared` ortamını kullanır ve Telegram şeridi Convex lease’lerini kullanır. `OpenClaw Release Checks` de sürüm onayından önce aynı QA Lab şeritlerini çalıştırır.

## İş Genel Bakışı

| İş                               | Amaç                                                                                         | Ne zaman çalışır                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen eklentileri algılar ve CI manifestini oluşturur | Taslak olmayan push ve PR’lerde her zaman |
| `security-scm-fast`              | `zizmor` aracılığıyla özel anahtar tespiti ve iş akışı denetimi                              | Taslak olmayan push ve PR’lerde her zaman |
| `security-dependency-audit`      | npm advisories’e karşı bağımlılıksız üretim lockfile denetimi                                | Taslak olmayan push ve PR’lerde her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için zorunlu toplu iş                                                  | Taslak olmayan push ve PR’lerde her zaman |
| `build-artifacts`                | `dist/`, Control UI, derlenmiş artifact kontrolleri ve yeniden kullanılabilir alt akış artifact’lerini derler | Node ile ilgili değişiklikler       |
| `checks-fast-core`               | bundled/plugin-contract/protocol kontrolleri gibi hızlı Linux doğruluk şeritleri             | Node ile ilgili değişiklikler       |
| `checks-fast-contracts-channels` | Kararlı bir toplu kontrol sonucu ile shard’lanmış kanal sözleşmesi kontrolleri               | Node ile ilgili değişiklikler       |
| `checks-node-extensions`         | eklenti paketi genelinde tam bundled-plugin test shard’ları                                  | Node ile ilgili değişiklikler       |
| `checks-node-core-test`          | Kanal, bundled, contract ve extension şeritleri hariç çekirdek Node test shard’ları         | Node ile ilgili değişiklikler       |
| `extension-fast`                 | Yalnızca değişen bundled plugin’ler için odaklanmış testler                                  | Eklenti değişiklikleri içeren pull request’ler |
| `check`                          | Shard’lanmış ana yerel geçit eşdeğeri: prod türleri, lint, guard’lar, test türleri ve katı smoke | Node ile ilgili değişiklikler       |
| `check-additional`               | Mimari, sınır, extension-surface guard’ları, package-boundary ve gateway-watch shard’ları    | Node ile ilgili değişiklikler       |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke testi                                | Node ile ilgili değişiklikler       |
| `checks`                         | Derlenmiş artifact kanal testleri ile yalnızca push için Node 22 uyumluluğu doğrulayıcısı    | Node ile ilgili değişiklikler       |
| `check-docs`                     | Dokümantasyon biçimlendirme, lint ve bozuk bağlantı kontrolleri                              | Dokümantasyon değiştiğinde          |
| `skills-python`                  | Python tabanlı Skills için Ruff + pytest                                                     | Python-skill ile ilgili değişiklikler |
| `checks-windows`                 | Windows’a özgü test şeritleri                                                                | Windows ile ilgili değişiklikler    |
| `macos-node`                     | Paylaşılan derlenmiş artifact’leri kullanan macOS TypeScript test şeridi                     | macOS ile ilgili değişiklikler      |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                         | macOS ile ilgili değişiklikler      |
| `android`                        | Her iki flavor için Android birim testleri ve bir debug APK derlemesi                        | Android ile ilgili değişiklikler    |

## Hızlı Başarısız Olma Sırası

İşler, pahalı işler çalışmadan önce ucuz kontroller başarısız olacak şekilde sıralanır:

1. `preflight`, hangi şeritlerin var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bağımsız işler değil, bu işin içindeki adımlardır.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matris işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, paylaşılan derleme hazır olur olmaz alt tüketiciler başlayabilsin diye hızlı Linux şeritleriyle örtüşür.
4. Daha ağır platform ve çalışma zamanı şeritleri bundan sonra dağıtılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, yalnızca PR için `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde yer alır ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testleriyle kapsanır.
CI iş akışı düzenlemeleri Node CI grafiğini ve iş akışı linting’ini doğrular, ancak tek başına Windows, Android veya macOS yerel derlemelerini zorunlu kılmaz; bu platform şeritleri platform kaynak kodu değişiklikleriyle kapsamlı kalır.
Windows Node kontrolleri, Windows’a özgü process/path wrapper’ları, npm/pnpm/UI runner yardımcıları, paket yöneticisi yapılandırması ve bu şeridi çalıştıran CI iş akışı yüzeyleriyle kapsamlandırılır; ilgisiz kaynak kodu, eklenti, install-smoke ve yalnızca test değişiklikleri Linux Node şeritlerinde kalır, böylece zaten normal test shard’larında kapsanan kapsam için 16-vCPU’lu bir Windows worker ayrılmaz.
Ayrı `install-smoke` iş akışı, kendi `preflight` işi aracılığıyla aynı kapsam betiğini yeniden kullanır. Daha dar changed-smoke sinyalinden `run_install_smoke` hesaplar; böylece Docker/install smoke, install, paketleme, container ile ilgili değişiklikler, bundled extension üretim değişiklikleri ve Docker smoke işlerinin çalıştırdığı çekirdek plugin/channel/gateway/Plugin SDK yüzeyleri için çalışır. Yalnızca test ve yalnızca dokümantasyon düzenlemeleri Docker worker’larını ayırmaz. QR paket smoke, BuildKit pnpm store önbelleğini korurken Docker `pnpm install` katmanını yeniden çalıştırmaya zorlar, böylece her çalıştırmada bağımlılıkları yeniden indirmeden kurulumu yine de sınar. gateway-network e2e, işin daha önce oluşturduğu çalışma zamanı imajını yeniden kullanır; böylece başka bir Docker derlemesi eklemeden gerçek container-to-container WebSocket kapsamı ekler. Yerel `test:docker:all`, paylaşılan bir canlı test imajı ve paylaşılan bir `scripts/e2e/Dockerfile` derlenmiş uygulama imajını önceden oluşturur, ardından canlı/E2E smoke şeritlerini `OPENCLAW_SKIP_DOCKER_BUILD=1` ile paralel çalıştırır; varsayılan 4 eşzamanlılığı `OPENCLAW_DOCKER_ALL_PARALLELISM` ile ayarlayın. Yerel toplu akış varsayılan olarak ilk başarısızlıktan sonra yeni havuzlanmış şeritler planlamayı durdurur ve her şeridin `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` ile geçersiz kılınabilen 120 dakikalık zaman aşımı vardır. Başlangıca veya sağlayıcıya duyarlı şeritler paralel havuzdan sonra münhasıran çalışır. Yeniden kullanılabilir canlı/E2E iş akışı, Docker matrisinden önce SHA etiketli tek bir GHCR Docker E2E imajı derleyip göndererek paylaşılan imaj modelini yansıtır, ardından matrisi `OPENCLAW_SKIP_DOCKER_BUILD=1` ile çalıştırır. Zamanlanmış canlı/E2E iş akışı, tam sürüm yolu Docker paketini günlük çalıştırır. QR ve yükleyici Docker testleri kendi kurulum odaklı Dockerfile’larını korur. Ayrı bir `docker-e2e-fast` işi, sınırlandırılmış bundled-plugin Docker profilini 120 saniyelik komut zaman aşımı altında çalıştırır: setup-entry bağımlılık onarımı ve sentetik bundled-loader failure isolation. Tam bundled update/channel matrisi manuel/tam paket olarak kalır çünkü tekrarlanan gerçek npm update ve doctor onarım geçişleri yapar.

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde yer alır ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel geçit, geniş CI platform kapsamına göre mimari sınırlarda daha katıdır: çekirdek üretim değişiklikleri çekirdek prod typecheck artı çekirdek testleri çalıştırır, yalnızca çekirdek test değişiklikleri yalnızca çekirdek test typecheck/test’lerini çalıştırır, extension üretim değişiklikleri extension prod typecheck artı extension testlerini çalıştırır ve yalnızca extension test değişiklikleri yalnızca extension test typecheck/test’lerini çalıştırır. Genel Plugin SDK veya plugin-contract değişiklikleri extension doğrulamasına genişler çünkü extension’lar bu çekirdek sözleşmelere bağımlıdır. Yalnızca sürüm metaverisi içeren version bump’ları hedeflenmiş version/config/root-dependency kontrolleri çalıştırır. Bilinmeyen root/config değişiklikleri güvenli tarafta kalıp tüm şeritlere yayılır.

Push’larda `checks` matrisi yalnızca push için olan `compat-node22` şeridini ekler. Pull request’lerde bu şerit atlanır ve matris normal test/kanal şeritlerine odaklı kalır.

En yavaş Node test aileleri bölünür veya dengelenir, böylece her iş runner’ları gereğinden fazla ayırmadan küçük kalır: kanal sözleşmeleri üç ağırlıklı shard olarak çalışır, bundled plugin testleri altı extension worker arasında dengelenir, küçük çekirdek birim şeritleri eşleştirilir, auto-reply altı küçük worker yerine üç dengeli worker olarak çalışır ve agentic gateway/plugin yapılandırmaları derlenmiş artifact’leri beklemek yerine mevcut yalnızca kaynak agentic Node işlerine dağıtılır. Geniş browser, QA, medya ve çeşitli plugin testleri, paylaşılan plugin catch-all yerine kendilerine ayrılmış Vitest yapılandırmalarını kullanır. Geniş agents şeridi, tek bir yavaş test dosyasına ait olmaktan çok import/zamanlama ağırlıklı olduğu için paylaşılan Vitest dosya paralel zamanlayıcısını kullanır. `runtime-config`, paylaşılan runtime shard’ının kuyruğun sonuna kalmasını önlemek için infra core-runtime shard’ı ile çalışır. `check-additional`, package-boundary derleme/canary işlerini bir arada tutar ve runtime topology architecture’ı gateway watch kapsamından ayırır; boundary guard shard’ı küçük bağımsız guard’larını tek iş içinde eşzamanlı çalıştırır. Gateway watch, kanal testleri ve çekirdek support-boundary shard’ı, `dist/` ve `dist-runtime/` zaten derlendikten sonra `build-artifacts` içinde eşzamanlı çalışır; eski kontrol adlarını hafif doğrulayıcı işler olarak korurken iki ek Blacksmith worker’ı ve ikinci bir artifact consumer kuyruğunu önler.
Android CI hem `testPlayDebugUnitTest` hem de `testThirdPartyDebugUnitTest` çalıştırır, ardından Play debug APK’sını derler. third-party flavor’ın ayrı bir kaynak kümesi veya manifest’i yoktur; birim test şeridi yine de bu flavor’ı SMS/call-log BuildConfig işaretleriyle derlerken, Android ile ilgili her push’ta yinelenen bir debug APK paketleme işinden kaçınır.
`extension-fast` yalnızca PR içindir çünkü push çalıştırmaları zaten tam bundled plugin shard’larını yürütür. Bu, incelemeler için değişen plugin geri bildirimini korurken `main` üzerinde zaten `checks-node-extensions` içinde bulunan kapsam için ek bir Blacksmith worker ayrılmasını önler.

GitHub, aynı PR veya `main` ref’i üzerine daha yeni bir push geldiğinde yerini alan işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız olmadıkça bunu CI gürültüsü olarak değerlendirin. Toplu shard kontrolleri `!cancelled() && always()` kullanır; böylece normal shard başarısızlıklarını yine raporlarlar ancak tüm iş akışı zaten yerini yenisine bıraktığında kuyruğa girmezler.
CI eşzamanlılık anahtarı sürümlüdür (`CI-v7-*`); böylece eski bir kuyruk grubundaki GitHub taraflı bir zombi, daha yeni main çalıştırmalarını süresiz olarak engelleyemez.

## Çalıştırıcılar

| Çalıştırıcı                      | İşler                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, hızlı güvenlik işleri ve toplu işler (`security-scm-fast`, `security-dependency-audit`, `security-fast`), hızlı protocol/contract/bundled kontrolleri, shard’lanmış kanal sözleşmesi kontrolleri, lint dışındaki `check` shard’ları, `check-additional` shard’ları ve toplu işleri, Node test toplu doğrulayıcıları, dokümantasyon kontrolleri, Python Skills, workflow-sanity, labeler, auto-response; install-smoke preflight da Blacksmith matrisi daha erken kuyruğa girebilsin diye GitHub-hosted Ubuntu kullanır |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node test shard’ları, bundled plugin test shard’ları, `android`                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`; bu iş CPU’ya yeterince duyarlı kaldığı için 8 vCPU tasarruf ettiğinden daha pahalıya mal oldu; install-smoke Docker derlemeleri; burada 32-vCPU kuyruk süresi sağladığı tasarruftan daha pahalıya mal oldu                                                                                                                                                                                                                                            |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-6vcpu-macos-latest`  | `openclaw/openclaw` üzerinde `macos-node`; fork’lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-swift`; fork’lar `macos-latest` değerine geri döner                                                                                                                                                                                                                                                                                                                                                                              |

## Yerel Eşdeğerler

```bash
pnpm changed:lanes   # origin/main...HEAD için yerel changed-lane sınıflandırıcısını inceleyin
pnpm check:changed   # akıllı yerel geçit: sınır şeridine göre değişen typecheck/lint/testler
pnpm check          # hızlı yerel geçit: üretim tsgo + shard’lanmış lint + paralel hızlı guard’lar
pnpm check:test-types
pnpm check:timed    # aynı geçit, aşama başına sürelerle birlikte
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest testleri
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # dokümantasyon biçimlendirme + lint + bozuk bağlantılar
pnpm build          # CI artifact/build-smoke şeritleri önemli olduğunda dist derleyin
node scripts/ci-run-timings.mjs <run-id>      # duvar saati süresi, kuyruk süresi ve en yavaş işleri özetleyin
node scripts/ci-run-timings.mjs --recent 10   # son başarılı main CI çalıştırmalarını karşılaştırın
```
