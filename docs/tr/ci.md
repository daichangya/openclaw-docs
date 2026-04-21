---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekir.
    - Başarısız GitHub Actions kontrollerinde hata ayıklıyorsunuz.
summary: CI iş grafiği, kapsam kapıları ve yerel komut eşdeğerleri
title: CI İşlem Hattı
x-i18n:
    generated_at: "2026-04-21T19:20:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d01a178402976cdf7c3c864695e8a12d3f7d1d069a77ea1b02a8aef2a3497f7
    source_path: ci.md
    workflow: 15
---

# CI İşlem Hattı

CI, `main` dalına yapılan her push'ta ve her pull request'te çalışır. Yalnızca ilgisiz alanlar değiştiğinde pahalı işleri atlamak için akıllı kapsamlandırma kullanır.

## İş Genel Bakışı

| İş                               | Amaç                                                                                         | Ne zaman çalışır                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen uzantıları tespit eder ve CI manifestini oluşturur | Taslak olmayan push ve PR'lerde her zaman |
| `security-scm-fast`              | `zizmor` aracılığıyla özel anahtar tespiti ve iş akışı denetimi                              | Taslak olmayan push ve PR'lerde her zaman |
| `security-dependency-audit`      | npm danışma kayıtlarına karşı bağımlılık içermeyen production lockfile denetimi             | Taslak olmayan push ve PR'lerde her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli toplu iş                                                  | Taslak olmayan push ve PR'lerde her zaman |
| `build-artifacts`                | `dist/` ve Control UI'ı bir kez derler, alt işler için yeniden kullanılabilir artifact'leri yükler | Node ile ilgili değişiklikler       |
| `checks-fast-core`               | Paketlenmiş/plugin-contract/protocol kontrolleri gibi hızlı Linux doğruluk hatları          | Node ile ilgili değişiklikler       |
| `checks-fast-contracts-channels` | Kararlı bir toplu kontrol sonucu ile parçalara ayrılmış kanal sözleşmesi kontrolleri        | Node ile ilgili değişiklikler       |
| `checks-node-extensions`         | Uzantı paketi genelinde tam paketlenmiş plugin test parçaları                                | Node ile ilgili değişiklikler       |
| `checks-node-core-test`          | Kanal, paketlenmiş, sözleşme ve uzantı hatları hariç çekirdek Node test parçaları           | Node ile ilgili değişiklikler       |
| `extension-fast`                 | Yalnızca değişen paketlenmiş plugin'ler için odaklanmış testler                              | Uzantı değişiklikleri tespit edildiğinde |
| `check`                          | Parçalara ayrılmış ana yerel kapı eşdeğeri: production type'lar, lint, korumalar, test type'ları ve sıkı smoke | Node ile ilgili değişiklikler       |
| `check-additional`               | Mimari, sınır, uzantı-yüzeyi korumaları, paket sınırı ve gateway-watch parçaları            | Node ile ilgili değişiklikler       |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke testi                                | Node ile ilgili değişiklikler       |
| `checks`                         | Kalan Linux Node hatları: kanal testleri ve yalnızca push'ta çalışan Node 22 uyumluluğu     | Node ile ilgili değişiklikler       |
| `check-docs`                     | Dokümantasyon biçimlendirme, lint ve bozuk bağlantı kontrolleri                              | Dokümanlar değiştiğinde             |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                   | Python Skills ile ilgili değişiklikler |
| `checks-windows`                 | Windows'a özgü test hatları                                                                  | Windows ile ilgili değişiklikler    |
| `macos-node`                     | Paylaşılan derlenmiş artifact'leri kullanan macOS TypeScript test hattı                      | macOS ile ilgili değişiklikler      |
| `macos-swift`                    | macOS uygulaması için Swift lint, build ve testler                                           | macOS ile ilgili değişiklikler      |
| `android`                        | Android build ve test matrisi                                                                | Android ile ilgili değişiklikler    |

## Hızlı Başarısız Olma Sırası

İşler, pahalı olanlar çalışmadan önce ucuz kontroller başarısız olacak şekilde sıralanır:

1. `preflight`, hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı, bağımsız işler değil bu işin içindeki adımlardır.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matris işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla çakışacak şekilde çalışır; böylece alt tüketiciler paylaşılan build hazır olur olmaz başlayabilir.
4. Ardından daha ağır platform ve çalışma zamanı hatları yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testlerle kapsanır.
Ayrı `install-smoke` iş akışı da kendi `preflight` işi üzerinden aynı kapsam betiğini yeniden kullanır. `run_install_smoke` değerini daha dar olan changed-smoke sinyalinden hesaplar; böylece Docker/install smoke yalnızca install, paketleme ve konteyner ile ilgili değişikliklerde çalışır.

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel kapı, geniş CI platform kapsamına göre mimari sınırlar konusunda daha sıkıdır: çekirdek production değişiklikleri çekirdek production typecheck artı çekirdek testleri çalıştırır, yalnızca çekirdek test değişiklikleri yalnızca çekirdek test typecheck/testlerini çalıştırır, uzantı production değişiklikleri uzantı production typecheck artı uzantı testlerini çalıştırır ve yalnızca uzantı test değişiklikleri yalnızca uzantı test typecheck/testlerini çalıştırır. Genel Plugin SDK veya plugin-contract değişiklikleri uzantı doğrulamasını genişletir çünkü uzantılar bu çekirdek sözleşmelere bağımlıdır. Bilinmeyen kök/config değişiklikleri güvenli tarafta kalmak için tüm hatlara başarısız olur.

Push'larda `checks` matrisi yalnızca push'ta çalışan `compat-node22` hattını ekler. Pull request'lerde bu hat atlanır ve matris normal test/kanal hatlarına odaklı kalır.

En yavaş Node test aileleri, her iş küçük kalsın diye include-file parçalarına ayrılır: kanal sözleşmeleri, registry ve çekirdek kapsamını sekizer ağırlıklı parçaya böler, auto-reply reply command testleri dörder include-pattern parçasına bölünür ve diğer büyük auto-reply reply prefix grupları ikişer parçaya ayrılır. `check-additional` ayrıca package-boundary compile/canary işini çalışma zamanı topolojisi gateway/mimari işinden ayırır.

GitHub, aynı PR veya `main` ref'ine daha yeni bir push geldiğinde yerini alan işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız olmuyorsa bunu CI gürültüsü olarak değerlendirin. Toplu parça kontrolleri bu iptal durumunu açıkça belirtir; böylece bunu bir test başarısızlığından ayırmak daha kolay olur.

## Çalıştırıcılar

| Çalıştırıcı                      | İşler                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux kontrolleri, doküman kontrolleri, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `openclaw/openclaw` üzerinde `macos-node`, `macos-swift`; fork'lar `macos-latest`'e geri döner                                                        |

## Yerel Eşdeğerler

```bash
pnpm changed:lanes   # origin/main...HEAD için yerel changed-lane sınıflandırıcısını inceleyin
pnpm check:changed   # akıllı yerel kapı: sınır hattına göre değişen typecheck/lint/testler
pnpm check          # hızlı yerel kapı: production tsgo + parçalara ayrılmış lint + paralel hızlı korumalar
pnpm check:test-types
pnpm check:timed    # aynı kapı, aşama başına sürelerle
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest testleri
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # doküman biçimlendirme + lint + bozuk bağlantılar
pnpm build          # CI artifact/build-smoke hatları önemliyse dist'i derleyin
```
