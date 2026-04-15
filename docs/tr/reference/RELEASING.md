---
read_when:
    - Herkese açık yayın kanalı tanımlarını arıyorum
    - Sürüm adlandırması ve yayın sıklığını arıyorum
summary: Herkese açık yayın kanalları, sürüm adlandırması ve yayın sıklığı
title: Yayın Politikası
x-i18n:
    generated_at: "2026-04-15T08:53:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88724307269ab783a9fbf8a0540fea198d8a3add68457f4e64d5707114fa518c
    source_path: reference/RELEASING.md
    workflow: 15
---

# Yayın Politikası

OpenClaw'ın herkese açık üç yayın kanalı vardır:

- stable: varsayılan olarak npm `beta`'ya yayımlanan etiketli sürümler veya açıkça istendiğinde npm `latest`'e yayımlanan sürümler
- beta: npm `beta`'ya yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli ucu

## Sürüm adlandırması

- Stable sürüm versiyonu: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Stable düzeltme sürümü versiyonu: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm versiyonu: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ayı veya günü başına sıfır koymayın
- `latest`, şu anda öne çıkarılmış stable npm sürümü anlamına gelir
- `beta`, şu andaki beta kurulum hedefi anlamına gelir
- Stable ve stable düzeltme sürümleri varsayılan olarak npm `beta`'ya yayımlanır; yayın operatörleri açıkça `latest`'i hedefleyebilir veya doğrulanmış bir beta derlemesini daha sonra öne çıkarabilir
- Her OpenClaw sürümü, npm paketini ve macOS uygulamasını birlikte yayımlar

## Yayın sıklığı

- Sürümler önce beta olarak ilerler
- Stable, yalnızca en son beta doğrulandıktan sonra gelir
- Ayrıntılı yayın prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca maintainers içindir

## Yayın öncesi kontroller

- Paket doğrulama adımı için beklenen
  `dist/*` yayın artifaktları ve Control UI paketi mevcut olsun diye
  `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Yayın kontrolleri artık ayrı bir manuel workflow içinde çalışır:
  `OpenClaw Release Checks`
- Platformlar arası kurulum ve yükseltme çalışma zamanı doğrulaması,
  özel çağırıcı workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  içinden başlatılır; bu workflow, yeniden kullanılabilir herkese açık workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
  dosyasını çağırır
- Bu ayrım bilerek yapılmıştır: gerçek npm yayın yolunu kısa,
  deterministik ve artifakt odaklı tutarken daha yavaş canlı kontrolleri kendi
  kanalında tutmak; böylece yayımlamayı geciktirmez veya engellemezler
- Yayın kontrolleri `main` workflow ref'inden başlatılmalıdır; böylece
  workflow mantığı ve secrets kanonik kalır
- Bu workflow, mevcut bir yayın etiketini veya geçerli tam
  40 karakterlik `main` commit SHA'sını kabul eder
- Commit-SHA modunda yalnızca geçerli `origin/main` HEAD kabul edilir; daha eski
  yayın commit'leri için bir yayın etiketi kullanın
- `OpenClaw NPM Release` yalnızca doğrulama amaçlı ön kontrolü de, itilmiş bir etiket gerektirmeden,
  geçerli tam 40 karakterlik `main` commit SHA'sını kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayıma dönüştürülemez
- SHA modunda workflow, paket meta verisi kontrolü için yalnızca
  `v<package.json version>` üretir; gerçek yayımlama yine de gerçek bir yayın etiketi gerektirir
- Her iki workflow da gerçek yayımlama ve öne çıkarma yolunu GitHub barındırmalı
  runner'larda tutarken, durum değiştirmeyen doğrulama yolu daha büyük
  Blacksmith Linux runner'larını kullanabilir
- Bu workflow,
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` workflow secrets'ını kullanarak çalıştırır
- npm yayın ön kontrolü artık ayrı yayın kontrolleri kanalını beklemiyor
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  komutunu (veya eşleşen beta/düzeltme etiketini) çalıştırın
- npm yayımlandıktan sonra, yayımlanan kayıt defteri
  kurulum yolunu yeni bir geçici prefix içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  komutunu (veya eşleşen beta/düzeltme versiyonunu) çalıştırın
- Maintainer yayın otomasyonu artık önce ön kontrol sonra öne çıkarma modelini kullanıyor:
  - gerçek npm yayımlama, başarılı bir npm `preflight_run_id` geçmelidir
  - stable npm sürümleri varsayılan olarak `beta`'yı kullanır
  - stable npm yayımlama, workflow girdisiyle açıkça `latest`'i hedefleyebilir
  - token tabanlı npm dist-tag değişikliği artık güvenlik nedeniyle
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içinde yer alır; çünkü `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken
    herkese açık repo yalnızca OIDC ile yayımlamayı korur
  - herkese açık `macOS Release` yalnızca doğrulama içindir
  - gerçek özel mac yayımlama, başarılı özel mac
    `preflight_run_id` ve `validate_run_id` geçmelidir
  - gerçek yayımlama yolları, artifaktları yeniden derlemek yerine
    hazırlanmış artifaktları öne çıkarır
- `YYYY.M.D-N` gibi stable düzeltme sürümleri için, yayımlama sonrası doğrulayıcı
  ayrıca `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne aynı geçici prefix yükseltme yolunu da
  kontrol eder; böylece sürüm düzeltmeleri, daha eski global kurulumları temel
  stable yük üzerinde sessizce bırakmaz
- npm yayın ön kontrolü, tarball hem
  `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` yükü içermiyorsa
  kapalı şekilde başarısız olur; böylece yine boş bir tarayıcı kontrol paneli yayımlamayız
- `pnpm test:install:smoke` ayrıca aday güncelleme tarball'ında npm pack
  `unpackedSize` bütçesini de zorunlu kılar; böylece yükleyici e2e, yanlışlıkla oluşan paket şişmesini
  yayın yayımlama yolundan önce yakalar
- Yayın çalışması CI planlamasına, eklenti zamanlama manifest'lerine veya
  eklenti test matrislerine dokunduysa, onaydan önce
  `.github/workflows/ci.yml` içindeki planner'a ait
  `checks-node-extensions` workflow matris çıktılarını yeniden üretin ve inceleyin;
  böylece yayın notları eski bir CI düzenini açıklamaz
- Stable macOS sürümü için hazır olma durumu ayrıca güncelleyici yüzeylerini de içerir:
  - GitHub sürümünde paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` bulunmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni stable zip'i işaret etmelidir
  - paketlenmiş uygulama, debug olmayan bir bundle id, boş olmayan bir Sparkle feed
    URL'si ve o sürüm versiyonu için kanonik Sparkle derleme tabanına eşit veya daha yüksek
    bir `CFBundleVersion` korumalıdır

## NPM workflow girdileri

`OpenClaw NPM Release`, operatör tarafından kontrol edilen şu girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya
  `v2026.4.2-beta.1` gibi gerekli yayın etiketi; `preflight_only=true` olduğunda ayrıca yalnızca doğrulama amaçlı ön kontrol için
  geçerli tam 40 karakterlik `main` commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek
  yayımlama yolu için `false`
- `preflight_run_id`: gerçek yayımlama yolunda gereklidir; böylece workflow,
  başarılı ön kontrol çalışmasından hazırlanmış tarball'ı yeniden kullanır
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılanı `beta`'dır

`OpenClaw Release Checks`, operatör tarafından kontrol edilen şu girdileri kabul eder:

- `ref`: doğrulanacak mevcut yayın etiketi veya geçerli tam 40 karakterlik `main` commit
  SHA'sı

Kurallar:

- Stable ve düzeltme etiketleri `beta` veya `latest`'e yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta`'ya yayımlanabilir
- Tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- Yayın kontrolleri commit-SHA modu ayrıca geçerli `origin/main` HEAD'i gerektirir
- Gerçek yayımlama yolu, ön kontrol sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır;
  workflow, yayımlama devam etmeden önce bu meta veriyi doğrular

## Stable npm sürüm sırası

Bir stable npm sürümü çıkarırken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Henüz bir etiket yoksa, ön kontrol workflow'unun
     yalnızca doğrulama amaçlı kuru çalıştırması için geçerli tam `main` commit SHA'sını kullanabilirsiniz
2. Normal beta-first akışı için `npm_dist_tag=beta` seçin veya yalnızca
   doğrudan stable yayımlamayı özellikle istiyorsanız `latest` seçin
3. Canlı prompt cache kapsamı istediğinizde,
   aynı etiketle veya geçerli tam `main` commit SHA'sıyla ayrı olarak
   `OpenClaw Release Checks` çalıştırın
   - Bu ayrım bilerek yapılmıştır; böylece canlı kapsam kullanılabilir kalırken
     uzun süren veya kararsız kontroller yeniden yayımlama workflow'una bağlanmaz
4. Başarılı `preflight_run_id` değerini kaydedin
5. `preflight_only=false`, aynı
   `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile
   `OpenClaw NPM Release`'i yeniden çalıştırın
6. Sürüm `beta` üzerinde yayımlandıysa, bu stable sürümü `beta`'dan `latest`'e
   öne çıkarmak için özel
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   workflow'unu kullanın
7. Sürüm kasıtlı olarak doğrudan `latest`'e yayımlandıysa ve `beta`
   aynı stable derlemeyi hemen takip edecekse, her iki dist-tag'i de stable versiyona işaret ettirmek için
   aynı özel workflow'u kullanın veya planlanmış
   self-healing sync'in `beta`yı daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik nedeniyle özel repo içinde tutulur; çünkü hâlâ
`NPM_TOKEN` gerektirirken herkese açık repo yalnızca OIDC ile yayımlamayı korur.

Bu, doğrudan yayımlama yolunu ve beta-first öne çıkarma yolunu hem
belgelenmiş hem de operatör tarafından görünür halde tutar.

## Herkese açık başvurular

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers, gerçek runbook için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel yayın belgelerini kullanır.
