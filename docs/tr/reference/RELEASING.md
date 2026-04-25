---
read_when:
    - Herkese açık sürüm kanalı tanımlarını arıyorum
    - Sürüm adlandırması ve sıklığını arıyorum
summary: Herkese açık sürüm kanalları, sürüm adlandırması ve sıklığı
title: Sürüm politikası
x-i18n:
    generated_at: "2026-04-25T13:56:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc20f30345cbc6c0897e63c9f6a554f9c25be0b52df3efc7d2bbd8827891984a
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw’ın herkese açık üç sürüm hattı vardır:

- stable: varsayılan olarak npm `beta`’ya veya açıkça istendiğinde npm `latest`’e yayımlanan etiketli sürümler
- beta: npm `beta`’ya yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli en güncel hali

## Sürüm adlandırması

- Stable sürüm sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Stable düzeltme sürümü sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ayı veya günü başına sıfır eklemeyin
- `latest`, şu anki yükseltilmiş stable npm sürümü anlamına gelir
- `beta`, şu anki beta kurulum hedefi anlamına gelir
- Stable ve stable düzeltme sürümleri varsayılan olarak npm `beta`’ya yayımlanır; sürüm operatörleri açıkça `latest`’i hedefleyebilir veya daha sonra doğrulanmış bir beta derlemesini yükseltebilir
- Her stable OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte dağıtır;
  beta sürümleri normalde önce npm/paket yolunu doğrular ve yayımlar; mac
  uygulamasının derlenmesi/imzalanması/noterleştirilmesi ise açıkça
  istenmedikçe stable için ayrılır

## Sürüm sıklığı

- Sürümler önce beta olarak ilerler
- Stable, yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde sürümleri, mevcut `main` dalından oluşturulan bir
  `release/YYYY.M.D` dalından çıkarır; böylece sürüm doğrulaması ve düzeltmeleri
  `main` üzerindeki yeni geliştirmeleri engellemez
- Bir beta etiketi itilmişse veya yayımlanmışsa ve bir düzeltmeye ihtiyaç
  duyuyorsa, bakımcılar eski beta etiketini silmek veya yeniden oluşturmak
  yerine sonraki `-beta.N` etiketini oluşturur
- Ayrıntılı sürüm prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca bakımcılara yöneliktir

## Sürüm ön kontrolü

- Test TypeScript kapsamının daha hızlı yerel `pnpm check` geçidinin dışında da
  korunması için sürüm ön kontrolünden önce `pnpm check:test-types` çalıştırın
- Daha geniş import döngüsü ve mimari sınır kontrollerinin daha hızlı yerel
  geçidin dışında da yeşil olması için sürüm ön kontrolünden önce
  `pnpm check:architecture` çalıştırın
- Paket doğrulama adımı için beklenen `dist/*` sürüm çıktılarının ve Control UI
  paketinin mevcut olması amacıyla `pnpm release:check` öncesinde
  `pnpm build && pnpm ui:build` çalıştırın
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Sürüm kontrolleri artık ayrı bir manuel workflow içinde çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab sahte parity geçidini
  ve canlı Matrix ile Telegram QA hatlarını da çalıştırır. Canlı hatlar
  `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi
  kiralarını da kullanır.
- İşletim sistemleri arası kurulum ve yükseltme çalışma zamanı doğrulaması,
  özel çağırıcı workflow olan
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  içinden tetiklenir ve yeniden kullanılabilir herkese açık workflow olan
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  dosyasını çağırır
- Bu ayrım bilinçlidir: gerçek npm sürüm yolunu kısa, deterministik ve artefakt
  odaklı tutarken daha yavaş canlı kontrollerin kendi hattında kalmasını sağlar;
  böylece yayımlamayı yavaşlatmaz veya engellemez
- Sürüm kontrolleri, workflow mantığının ve sırların denetimli kalması için
  `main` workflow referansından veya bir `release/YYYY.M.D` workflow
  referansından tetiklenmelidir
- Bu workflow, mevcut bir sürüm etiketini veya workflow dalının geçerli tam
  40 karakterlik commit SHA’sını kabul eder
- Commit-SHA modunda yalnızca workflow dalının geçerli HEAD’i kabul edilir;
  daha eski sürüm commit’leri için bir sürüm etiketi kullanın
- `OpenClaw NPM Release` yalnızca doğrulama amaçlı ön kontrol de,
  itilmiş bir etiket gerektirmeden workflow dalının geçerli tam 40 karakterlik
  commit SHA’sını kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayımlamaya
  yükseltilemez
- SHA modunda workflow, paket meta veri kontrolü için yalnızca
  `v<package.json version>` üretir; gerçek yayımlama yine gerçek bir sürüm
  etiketi gerektirir
- Her iki workflow da gerçek yayımlama ve yükseltme yolunu GitHub-hosted
  runner’larda tutarken, değişiklik yapmayan doğrulama yolu daha büyük
  Blacksmith Linux runner’larını kullanabilir
- Bu workflow,
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` workflow sırlarıyla
  çalıştırır
- npm sürüm ön kontrolü artık ayrı sürüm kontrolleri hattını beklemez
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  komutunu çalıştırın
  (veya eşleşen beta/düzeltme etiketiyle)
- npm yayımlandıktan sonra, taze bir geçici önek içinde yayımlanmış kayıt
  defteri kurulum yolunu doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  komutunu çalıştırın
  (veya eşleşen beta/düzeltme sürümüyle)
- Bir beta yayımlamasından sonra, yayımlanmış npm paketine karşı kurulu paket
  onboarding’ini, Telegram kurulumunu ve gerçek Telegram E2E’yi paylaşılan
  kiralanmış Telegram kimlik bilgisi havuzunu kullanarak doğrulamak için
  `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  komutunu çalıştırın. Yerel bakımcı tek seferlik çalıştırmalarında Convex
  değişkenleri atlanabilir ve üç adet `OPENCLAW_QA_TELEGRAM_*` ortam kimlik
  bilgisi doğrudan verilebilir.
- Bakımcılar aynı yayımlama sonrası kontrolü GitHub Actions üzerinden manuel
  `NPM Telegram Beta E2E` workflow ile çalıştırabilir. Bu workflow bilinçli
  olarak yalnızca manueldir ve her merge işleminde çalışmaz.
- Bakımcı sürüm otomasyonu artık ön kontrol-sonra-yükselt modelini kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` kontrolünden
    geçmelidir
  - gerçek npm yayımlaması, başarılı ön kontrol çalıştırmasıyla aynı `main`
    veya `release/YYYY.M.D` dalından tetiklenmelidir
  - stable npm sürümleri varsayılan olarak `beta` olur
  - stable npm yayımlaması workflow girdisiyle açıkça `latest`’i hedefleyebilir
  - token tabanlı npm dist-tag değişikliği artık güvenlik nedeniyle
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içinde yer alır; çünkü `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken
    herkese açık depo yalnızca OIDC ile yayımlamayı korur
  - herkese açık `macOS Release` yalnızca doğrulama içindir
  - gerçek özel mac yayımlaması, başarılı özel mac
    `preflight_run_id` ve `validate_run_id` kontrollerinden geçmelidir
  - gerçek yayımlama yolları, artefaktları yeniden derlemek yerine hazırlanmış
    artefaktları yükseltir
- `YYYY.M.D-N` gibi stable düzeltme sürümlerinde yayımlama sonrası doğrulayıcı,
  aynı geçici önek yükseltme yolunu da `YYYY.M.D` sürümünden `YYYY.M.D-N`
  sürümüne kontrol eder; böylece sürüm düzeltmeleri eski genel kurulumları
  sessizce temel stable yükü üzerinde bırakamaz
- npm sürüm ön kontrolü, paket dosyası hem `dist/control-ui/index.html` hem de
  boş olmayan bir `dist/control-ui/assets/` yükü içermedikçe başarısız olur;
  böylece tekrar boş bir tarayıcı panosu yayımlamayız
- Yayımlama sonrası doğrulama ayrıca yayımlanmış kayıt defteri kurulumunun kök
  `dist/*` düzeni altında boş olmayan paketlenmiş Plugin çalışma zamanı
  bağımlılıkları içerdiğini de kontrol eder. Eksik veya boş paketlenmiş Plugin
  bağımlılık yükleriyle yayımlanan bir sürüm, yayımlama sonrası doğrulayıcıda
  başarısız olur ve `latest`’e yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme paket dosyasındaki npm pack
  `unpackedSize` bütçesini de zorunlu kılar; böylece yükleyici e2e, sürüm
  yayımlama yolundan önce yanlışlıkla oluşan paket şişmesini yakalar
- Sürüm çalışması CI planlamasını, eklenti zamanlama manifestlerini veya
  eklenti test matrislerini etkilediyse, onaydan önce `.github/workflows/ci.yml`
  içindeki planlayıcıya ait `checks-node-extensions` workflow matris
  çıktılarının yeniden üretilip gözden geçirilmesi gerekir; böylece sürüm
  notları eski bir CI düzenini açıklamaz
- Stable macOS sürüm hazırlığı, güncelleyici yüzeylerini de kapsar:
  - GitHub sürümünde paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` bulunmalıdır
  - yayımlamadan sonra `main` üzerindeki `appcast.xml`, yeni stable zip’i
    işaret etmelidir
  - paketlenmiş uygulama, debug olmayan bir bundle id’yi, boş olmayan bir
    Sparkle feed URL’sini ve bu sürüm sürümü için kanonik Sparkle derleme taban
    değerine eşit veya ondan yüksek bir `CFBundleVersion` değerini korumalıdır

## NPM workflow girdileri

`OpenClaw NPM Release`, operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya `v2026.4.2-beta.1` gibi zorunlu sürüm
  etiketi; `preflight_only=true` olduğunda yalnızca doğrulama amaçlı ön kontrol
  için workflow dalının geçerli tam 40 karakterlik commit SHA’sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek
  yayımlama yolu için `false`
- `preflight_run_id`: gerçek yayımlama yolunda zorunludur; böylece workflow,
  başarılı ön kontrol çalıştırmasındaki hazırlanmış paket dosyasını yeniden
  kullanır
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılanı `beta`

`OpenClaw Release Checks`, operatör tarafından denetlenen şu girdileri kabul eder:

- `ref`: `main` üzerinden tetiklendiğinde doğrulanacak mevcut sürüm etiketi
  veya geçerli tam 40 karakterlik `main` commit SHA’sı; bir sürüm dalından
  çalıştırıldığında mevcut bir sürüm etiketi veya geçerli tam 40 karakterlik
  sürüm dalı commit SHA’sı kullanılır

Kurallar:

- Stable ve düzeltme etiketleri `beta` veya `latest`’e yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta`’ya yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca
  `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` her zaman yalnızca doğrulama içindir ve ayrıca
  workflow dalının geçerli commit SHA’sını da kabul eder
- Sürüm kontrolleri commit-SHA modu ayrıca workflow dalının geçerli HEAD’ini de
  gerektirir
- Gerçek yayımlama yolu, ön kontrol sırasında kullanılan aynı `npm_dist_tag`
  değerini kullanmalıdır; workflow yayımlama devam etmeden önce bu meta veriyi
  doğrular

## Stable npm sürüm sırası

Bir stable npm sürümü çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Etiket henüz mevcut değilse, ön kontrol workflow’unun yalnızca doğrulama
     amaçlı deneme çalıştırması için workflow dalının geçerli tam commit
     SHA’sını kullanabilirsiniz
2. Normal beta-önce akışı için `npm_dist_tag=beta` seçin veya yalnızca
   doğrudan stable yayımlama yapmak istediğinizde `latest` seçin
3. Canlı prompt cache, QA Lab parity, Matrix ve Telegram kapsamını istediğinizde
   aynı etiketle veya workflow dalının geçerli tam commit SHA’sıyla ayrı olarak
   `OpenClaw Release Checks` çalıştırın
   - Bu ayrım bilinçlidir; böylece canlı kapsam kullanılabilir kalırken uzun
     süren veya kararsız kontroller yayımlama workflow’una yeniden
     bağlanmamış olur
4. Başarılı `preflight_run_id` değerini kaydedin
5. `preflight_only=false`, aynı `tag`, aynı `npm_dist_tag` ve kaydedilmiş
   `preflight_run_id` ile `OpenClaw NPM Release` komutunu tekrar çalıştırın
6. Sürüm `beta` üzerinde yayımlandıysa, bu stable sürümü `beta`’dan `latest`’e
   yükseltmek için özel
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow’unu kullanın
7. Sürüm kasıtlı olarak doğrudan `latest`’e yayımlandıysa ve `beta` hemen aynı
   stable derlemeyi izlemeliyse, her iki dist-tag’i de stable sürümü işaret
   edecek şekilde aynı özel workflow’u kullanın veya zamanlanmış otomatik
   iyileştirme eşitlemesinin `beta`yı daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik nedeniyle özel depoda bulunur; çünkü bu işlem
hâlâ `NPM_TOKEN` gerektirirken herkese açık depo yalnızca OIDC ile yayımlamayı
korur.

Bu, hem doğrudan yayımlama yolunu hem de beta-önce yükseltme yolunu belgelenmiş
ve operatör tarafından görünür durumda tutar.

Bir bakımcının yerel npm kimlik doğrulamasına geri dönmesi gerekirse, herhangi
bir 1Password CLI (`op`) komutunu yalnızca ayrılmış bir tmux oturumu içinde
çalıştırın. `op` komutunu doğrudan ana ajan kabuğundan çağırmayın; onu tmux
içinde tutmak istemleri, uyarıları ve OTP işlemlerini görünür kılar ve tekrar
eden ana makine uyarılarını önler.

## Herkese açık başvurular

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Bakımcılar, gerçek çalışma kılavuzu için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel sürüm belgelerini kullanır.

## İlgili

- [Sürüm kanalları](/tr/install/development-channels)
