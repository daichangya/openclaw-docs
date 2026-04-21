---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekiyor
    - Başarısız GitHub Actions denetimlerinde hata ayıklıyorsunuz
summary: CI iş grafiği, kapsam geçitleri ve yerel komut eşdeğerleri
title: CI işlem hattı
x-i18n:
    generated_at: "2026-04-21T08:57:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88a98d777fd61be1603417b71779aaf42a24d602b2437ad549f0075f22494cec
    source_path: ci.md
    workflow: 15
---

# CI İşlem Hattı

CI, `main` dalına yapılan her push işleminde ve her pull request’te çalışır. Yalnızca ilgisiz alanlar değiştiğinde pahalı işleri atlamak için akıllı kapsamlandırma kullanır.

## İş Genel Görünümü

| İş                               | Amaç                                                                                         | Ne zaman çalışır                    |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen eklentileri saptar ve CI manifestini oluşturur | Taslak olmayan push ve PR’lerde her zaman |
| `security-scm-fast`              | `zizmor` aracılığıyla özel anahtar tespiti ve workflow denetimi                              | Taslak olmayan push ve PR’lerde her zaman |
| `security-dependency-audit`      | npm tavsiyelerine karşı bağımlılıksız üretim lockfile denetimi                               | Taslak olmayan push ve PR’lerde her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli toplu iş                                                  | Taslak olmayan push ve PR’lerde her zaman |
| `build-artifacts`                | `dist/` ve Control UI’yi bir kez derler, aşağı akış işleri için yeniden kullanılabilir artifact’ları yükler | Node ile ilgili değişiklikler       |
| `checks-fast-core`               | bundled/plugin-contract/protocol denetimleri gibi hızlı Linux doğruluk hatları               | Node ile ilgili değişiklikler       |
| `checks-fast-contracts-channels` | Kararlı bir toplu denetim sonucuyla parçalanmış kanal sözleşmesi denetimleri                 | Node ile ilgili değişiklikler       |
| `checks-node-extensions`         | eklenti paketi genelinde bundled-plugin test parçalarının tamamı                             | Node ile ilgili değişiklikler       |
| `checks-node-core-test`          | Kanal, bundled, contract ve extension hatları hariç olmak üzere çekirdek Node test parçaları | Node ile ilgili değişiklikler       |
| `extension-fast`                 | Yalnızca değişen bundled plugin’ler için odaklı testler                                      | Eklenti değişiklikleri algılandığında |
| `check`                          | Parçalanmış ana yerel geçit eşdeğeri: üretim türleri, lint, guard, test türleri ve katı smoke | Node ile ilgili değişiklikler       |
| `check-additional`               | Mimari, sınır, extension-surface guard, package-boundary ve gateway-watch parçaları          | Node ile ilgili değişiklikler       |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke testi                                | Node ile ilgili değişiklikler       |
| `checks`                         | Kalan Linux Node hatları: kanal testleri ve yalnızca push işlemlerinde Node 22 uyumluluğu   | Node ile ilgili değişiklikler       |
| `check-docs`                     | Dokümantasyon biçimlendirme, lint ve bozuk bağlantı denetimleri                              | Dokümantasyon değiştiğinde          |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                    | Python Skills ile ilgili değişiklikler |
| `checks-windows`                 | Windows’a özgü test hatları                                                                   | Windows ile ilgili değişiklikler    |
| `macos-node`                     | Paylaşılan derleme artifact’larını kullanan macOS TypeScript test hattı                      | macOS ile ilgili değişiklikler      |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                         | macOS ile ilgili değişiklikler      |
| `android`                        | Android derleme ve test matrisi                                                              | Android ile ilgili değişiklikler    |

## Hızlı başarısız olma sırası

İşler, pahalı işler çalışmadan önce ucuz denetimlerin başarısız olması için sıralanır:

1. `preflight`, hangi hatların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bağımsız işler değil, bu iş içindeki adımlardır.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifact ve platform matrisi işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux hatlarıyla çakışır; böylece aşağı akış tüketicileri paylaşılan derleme hazır olur olmaz başlayabilir.
4. Daha ağır platform ve çalışma zamanı hatları bundan sonra açılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testleriyle kapsanır.
Ayrı `install-smoke` workflow’su, kendi `preflight` işi aracılığıyla aynı kapsam betiğini yeniden kullanır. `run_install_smoke` değerini daha dar changed-smoke sinyalinden hesaplar; bu nedenle Docker/install smoke yalnızca kurulum, paketleme ve container ile ilgili değişikliklerde çalışır.

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel geçit, geniş CI platform kapsamına göre mimari sınırlar konusunda daha katıdır: çekirdek üretim değişiklikleri çekirdek üretim typecheck artı çekirdek testlerini çalıştırır; yalnızca çekirdek test değişiklikleri yalnızca çekirdek test typecheck/testlerini çalıştırır; eklenti üretim değişiklikleri eklenti üretim typecheck artı eklenti testlerini çalıştırır; yalnızca eklenti test değişiklikleri yalnızca eklenti test typecheck/testlerini çalıştırır. Genel Plugin SDK veya plugin-contract değişiklikleri, eklentiler bu çekirdek sözleşmelere bağlı olduğu için eklenti doğrulamasını genişletir. Bilinmeyen kök/yapılandırma değişiklikleri güvenli davranıp tüm hatları çalıştırır.

Push işlemlerinde, `checks` matrisi yalnızca push’a özel `compat-node22` hattını ekler. Pull request’lerde bu hat atlanır ve matris normal test/kanal hatlarına odaklı kalır.

En yavaş Node test aileleri, her iş küçük kalsın diye include-file parçalarına bölünür: kanal sözleşmeleri registry ve çekirdek kapsamını sekizer ağırlıklı parçaya böler, auto-reply reply command testleri dört include-pattern parçasına bölünür ve diğer büyük auto-reply reply prefix grupları ikişer parçaya bölünür. `check-additional` ayrıca package-boundary derleme/canary işlerini çalışma zamanı topolojisi gateway/mimari işlerinden ayırır.

Aynı PR veya `main` ref’i üzerinde daha yeni bir push geldiğinde GitHub, yerini alan işleri `cancelled` olarak işaretleyebilir. Aynı ref için en yeni çalıştırma da başarısız olmadıkça bunu CI gürültüsü olarak değerlendirin. Toplu parça denetimleri, bunu bir test başarısızlığından ayırmayı kolaylaştırmak için bu iptal durumunu açıkça belirtir.

## Çalıştırıcılar

| Çalıştırıcı                      | İşler                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux denetimleri, dokümantasyon denetimleri, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                                                                            |

## Yerel eşdeğerler

```bash
pnpm changed:lanes   # origin/main...HEAD için yerel changed-lane sınıflandırıcısını incele
pnpm check:changed   # akıllı yerel geçit: sınır hattına göre değişen typecheck/lint/testler
pnpm check          # hızlı yerel geçit: üretim tsgo + parçalanmış lint + paralel hızlı guard'lar
pnpm check:test-types
pnpm check:timed    # aşama başına zamanlamalarla aynı geçit
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest testleri
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # dokümantasyon biçimi + lint + bozuk bağlantılar
pnpm build          # CI artifact/build-smoke hatları önemliyse dist derle
```
