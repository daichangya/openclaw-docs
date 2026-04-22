---
read_when:
    - Bir CI işinin neden çalıştığını veya çalışmadığını anlamanız gerekir
    - Başarısız GitHub Actions kontrollerinde hata ayıklıyorsunuz
summary: CI iş grafiği, kapsam geçitleri ve yerel komut eşdeğerleri
title: CI ardışık düzeni
x-i18n:
    generated_at: "2026-04-22T08:54:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc7ec59123aee65634736320dbf1cf5cdfb08786a78cca82ce9596fedc68b3cc
    source_path: ci.md
    workflow: 15
---

# CI ardışık düzeni

CI, `main` dalına yapılan her push işleminde ve her pull request’te çalışır. Yalnızca ilgisiz alanlar değiştiğinde pahalı işleri atlamak için akıllı kapsamlandırma kullanır.

## İş Genel Görünümü

| İş                               | Amaç                                                                                       | Ne zaman çalışır                    |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------- |
| `preflight`                      | Yalnızca dokümantasyon değişikliklerini, değişen kapsamları, değişen eklentileri tespit etmek ve CI bildirimini oluşturmak | Taslak olmayan push ve PR’lerde her zaman |
| `security-scm-fast`              | `zizmor` aracılığıyla özel anahtar tespiti ve iş akışı denetimi                           | Taslak olmayan push ve PR’lerde her zaman |
| `security-dependency-audit`      | npm uyarılarına karşı bağımlılıksız üretim lockfile denetimi                              | Taslak olmayan push ve PR’lerde her zaman |
| `security-fast`                  | Hızlı güvenlik işleri için gerekli toplu iş                                                | Taslak olmayan push ve PR’lerde her zaman |
| `build-artifacts`                | `dist/` ve Control UI’ı bir kez derlemek, alt işlerde yeniden kullanılacak artifaktları yüklemek | Node ile ilgili değişiklikler       |
| `checks-fast-core`               | bundled/plugin-contract/protocol kontrolleri gibi hızlı Linux doğruluk aşamaları          | Node ile ilgili değişiklikler       |
| `checks-fast-contracts-channels` | Kararlı bir toplu kontrol sonucu ile parçalanmış kanal sözleşmesi kontrolleri             | Node ile ilgili değişiklikler       |
| `checks-node-extensions`         | eklenti paketi genelinde bundled-plugin tam test parçaları                                | Node ile ilgili değişiklikler       |
| `checks-node-core-test`          | Kanal, bundled, sözleşme ve eklenti aşamaları hariç tutularak çekirdek Node test parçaları | Node ile ilgili değişiklikler       |
| `extension-fast`                 | Yalnızca değişen bundled plugin’ler için odaklanmış testler                               | Eklenti değişiklikleri tespit edildiğinde |
| `check`                          | Parçalanmış ana yerel geçit eşdeğeri: üretim türleri, lint, korumalar, test türleri ve katı smoke | Node ile ilgili değişiklikler       |
| `check-additional`               | Mimari, sınır, eklenti yüzeyi korumaları, paket sınırı ve gateway-watch parçaları         | Node ile ilgili değişiklikler       |
| `build-smoke`                    | Derlenmiş CLI smoke testleri ve başlangıç belleği smoke testi                             | Node ile ilgili değişiklikler       |
| `checks`                         | Kalan Linux Node aşamaları: kanal testleri ve yalnızca push için Node 22 uyumluluğu       | Node ile ilgili değişiklikler       |
| `check-docs`                     | Dokümantasyon biçimlendirme, lint ve bozuk bağlantı kontrolleri                           | Dokümanlar değiştiğinde             |
| `skills-python`                  | Python destekli Skills için Ruff + pytest                                                 | Python Skills ile ilgili değişiklikler |
| `checks-windows`                 | Windows’a özgü test aşamaları                                                             | Windows ile ilgili değişiklikler    |
| `macos-node`                     | Paylaşılan derlenmiş artifaktları kullanan macOS TypeScript test aşaması                  | macOS ile ilgili değişiklikler      |
| `macos-swift`                    | macOS uygulaması için Swift lint, derleme ve testler                                      | macOS ile ilgili değişiklikler      |
| `android`                        | Android derleme ve test matrisi                                                           | Android ile ilgili değişiklikler    |

## Hızlı Başarısızlık Sırası

İşler, pahalı işler çalışmadan önce ucuz kontroller başarısız olacak şekilde sıralanır:

1. `preflight`, hangi aşamaların var olacağına karar verir. `docs-scope` ve `changed-scope` mantığı bağımsız işler değil, bu işin içindeki adımlardır.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` ve `skills-python`, daha ağır artifakt ve platform matris işlerini beklemeden hızlıca başarısız olur.
3. `build-artifacts`, hızlı Linux aşamalarıyla çakışır; böylece alt tüketiciler paylaşılan derleme hazır olur olmaz başlayabilir.
4. Bundan sonra daha ağır platform ve çalışma zamanı aşamaları yayılır: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` ve `android`.

Kapsam mantığı `scripts/ci-changed-scope.mjs` içinde bulunur ve `src/scripts/ci-changed-scope.test.ts` içindeki birim testleriyle kapsanır.
Ayrı `install-smoke` iş akışı, aynı kapsam betiğini kendi `preflight` işi üzerinden yeniden kullanır. `run_install_smoke` değerini daha dar changed-smoke sinyalinden hesaplar; bu nedenle Docker/install smoke yalnızca install, paketleme ve container ile ilgili değişikliklerde çalışır.

Yerel changed-lane mantığı `scripts/changed-lanes.mjs` içinde bulunur ve `scripts/check-changed.mjs` tarafından yürütülür. Bu yerel geçit, geniş CI platform kapsamına göre mimari sınırlar konusunda daha katıdır: çekirdek üretim değişiklikleri çekirdek üretim typecheck artı çekirdek testlerini çalıştırır, yalnızca çekirdek test değişiklikleri yalnızca çekirdek test typecheck/testlerini çalıştırır, eklenti üretim değişiklikleri eklenti üretim typecheck artı eklenti testlerini çalıştırır ve yalnızca eklenti test değişiklikleri yalnızca eklenti test typecheck/testlerini çalıştırır. Public Plugin SDK veya plugin-contract değişiklikleri, uzantılar bu çekirdek sözleşmelere bağlı olduğundan uzantı doğrulamasını genişletir. Yalnızca sürüm metadata’sı içeren sürüm artırımları hedefli sürüm/config/root-dependency kontrolleri çalıştırır. Bilinmeyen root/config değişiklikleri güvenli tarafta kalmak için tüm aşamalara yayılır.

Push işlemlerinde, `checks` matrisi yalnızca push için olan `compat-node22` aşamasını ekler. Pull request’lerde bu aşama atlanır ve matris normal test/kanal aşamalarına odaklı kalır.

En yavaş Node test aileleri, her iş küçük kalsın diye include-file parçalarına bölünür: kanal sözleşmeleri, kayıt defteri ve çekirdek kapsamını sekizer ağırlıklı parçaya böler; auto-reply reply command testleri dört include-pattern parçasına bölünür; diğer büyük auto-reply reply prefix grupları ise ikişer parçaya bölünür. `check-additional`, paket sınırı derleme/canary çalışmalarını çalışma zamanı topolojisi gateway/mimari çalışmalarından da ayırır.

GitHub, aynı PR veya `main` referansına daha yeni bir push geldiğinde yerini alan işleri `cancelled` olarak işaretleyebilir. Aynı referans için en yeni çalışma da başarısız olmuyorsa bunu bir test hatası değil, CI gürültüsü olarak değerlendirin. Toplu parça kontrolleri, bunun bir test başarısızlığından daha kolay ayırt edilmesi için bu iptal durumunu açıkça belirtir.

## Çalıştırıcılar

| Çalıştırıcı                      | İşler                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`; install-smoke preflight da Blacksmith matrisinin daha erken kuyruğa girebilmesi için GitHub barındırmalı Ubuntu kullanır |
| `blacksmith-16vcpu-ubuntu-2404`  | `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux kontrolleri, dokümantasyon kontrolleri, Python Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` için `openclaw/openclaw`; fork’lar `macos-latest` sürümüne geri döner                                      |

## Yerel Eşdeğerler

```bash
pnpm changed:lanes   # origin/main...HEAD için yerel changed-lane sınıflandırıcısını inceleyin
pnpm check:changed   # akıllı yerel geçit: sınır aşamasına göre değişen typecheck/lint/testler
pnpm check          # hızlı yerel geçit: production tsgo + parçalanmış lint + paralel hızlı korumalar
pnpm check:test-types
pnpm check:timed    # aşama başına sürelerle aynı geçit
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # vitest testleri
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # doküman biçimlendirme + lint + bozuk bağlantılar
pnpm build          # CI artifact/build-smoke aşamaları önemliyse dist derlemesi
```
