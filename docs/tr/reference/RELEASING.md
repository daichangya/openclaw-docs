---
read_when:
    - Herkese açık sürüm kanalı tanımlarını arıyorum
    - Sürüm adlandırması ve yayın sıklığını arıyorum
summary: Herkese açık sürüm kanalları, sürüm adlandırması ve yayın sıklığı
title: Sürüm Politikası
x-i18n:
    generated_at: "2026-04-14T02:08:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: fdc32839447205d74ba7a20a45fbac8e13b199174b442a1e260e3fce056c63da
    source_path: reference/RELEASING.md
    workflow: 15
---

# Sürüm Politikası

OpenClaw'ın herkese açık üç sürüm hattı vardır:

- stable: varsayılan olarak npm `beta`'ya veya açıkça istendiğinde npm `latest`'e yayımlanan etiketli sürümler
- beta: npm `beta`'ya yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli ucu

## Sürüm adlandırması

- Stable sürüm sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Stable düzeltme sürümü sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ayı veya günü başına sıfır eklemeyin
- `latest`, mevcut yükseltilmiş stable npm sürümü anlamına gelir
- `beta`, mevcut beta kurulum hedefi anlamına gelir
- Stable ve stable düzeltme sürümleri varsayılan olarak npm `beta`'ya yayımlanır; sürüm operatörleri açıkça `latest`'i hedefleyebilir veya daha sonra doğrulanmış bir beta derlemesini yükseltebilir
- Her OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte gönderir

## Sürüm sıklığı

- Sürümler önce beta olarak ilerler
- Stable, yalnızca en son beta doğrulandıktan sonra gelir
- Ayrıntılı sürüm prosedürü, onaylar, kimlik bilgileri ve kurtarma notları
  yalnızca maintainers içindir

## Sürüm ön kontrolü

- Paket doğrulama adımı için beklenen
  `dist/*` sürüm artefaktları ve Control UI paketi mevcut olsun diye
  `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Sürüm kontrolleri artık ayrı bir manuel workflow'da çalışıyor:
  `OpenClaw Release Checks`
- Bu ayrım bilinçlidir: gerçek npm sürüm yolunu kısa,
  deterministik ve artefakt odaklı tutarken, daha yavaş canlı kontroller kendi
  hattında kalsın ki yayımlamayı geciktirmesin veya engellemesin
- Workflow mantığı ve secret'lar kanonik kalsın diye sürüm
  kontrolleri `main` workflow ref'inden tetiklenmelidir
- Bu workflow, mevcut bir sürüm etiketini veya mevcut tam
  40 karakterlik `main` commit SHA'sını kabul eder
- Commit-SHA modunda yalnızca mevcut `origin/main` HEAD kabul edilir; daha eski
  sürüm commit'leri için sürüm etiketi kullanın
- `OpenClaw NPM Release` yalnızca doğrulama amaçlı ön kontrolü de, gönderilmiş
  bir etiket gerektirmeden mevcut tam 40 karakterlik `main` commit SHA'sını kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayıma yükseltilemez
- SHA modunda workflow, paket meta veri kontrolü için yalnızca
  `v<package.json version>` üretir; gerçek yayımlama için yine de gerçek bir sürüm etiketi gerekir
- Her iki workflow da gerçek yayımlama ve yükseltme yolunu GitHub-hosted
  runner'larda tutarken, değiştirmeyen doğrulama yolu daha büyük
  Blacksmith Linux runner'larını kullanabilir
- Bu workflow,
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` workflow secret'larını kullanarak çalıştırır
- npm sürüm ön kontrolü artık ayrı sürüm kontrolleri hattını beklemiyor
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  komutunu (veya eşleşen beta/düzeltme etiketini) çalıştırın
- npm yayımlandıktan sonra, yayımlanan registry
  kurulum yolunu yeni bir geçici prefix içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  komutunu (veya eşleşen beta/düzeltme sürümünü) çalıştırın
- Maintainer sürüm otomasyonu artık önce ön kontrol sonra yükseltme kullanıyor:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` geçmelidir
  - stable npm sürümleri varsayılan olarak `beta`'dır
  - stable npm yayımlaması workflow girdisi üzerinden açıkça `latest`'i hedefleyebilir
  - stable npm'yi `beta`'dan `latest`'e yükseltme, güvenilir `OpenClaw NPM Release` workflow'unda hâlâ açık bir manuel mod olarak kullanılabilir
  - doğrudan stable yayımlamalar, hem `latest` hem de `beta`yı daha önce yayımlanmış stable sürüme yönelten açık bir dist-tag eşitleme modunu da çalıştırabilir
  - bu dist-tag modları yine de `npm-release` ortamında geçerli bir `NPM_TOKEN` gerektirir çünkü npm `dist-tag` yönetimi güvenilir yayımlamadan ayrıdır
  - herkese açık `macOS Release` yalnızca doğrulama içindir
  - gerçek özel mac yayımlaması başarılı özel mac
    `preflight_run_id` ve `validate_run_id` geçmelidir
  - gerçek yayımlama yolları, artefaktları yeniden derlemek yerine hazırlanmış artefaktları yükseltir
- `YYYY.M.D-N` gibi stable düzeltme sürümlerinde, yayımlama sonrası doğrulayıcı
  aynı zamanda `YYYY.M.D`'den `YYYY.M.D-N`'e aynı geçici prefix yükseltme yolunu da kontrol eder;
  böylece sürüm düzeltmeleri eski global kurulumları sessizce temel stable payload üzerinde bırakamaz
- npm sürüm ön kontrolü, tarball hem
  `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` payload'u içermedikçe
  kapalı şekilde başarısız olur; böylece yeniden boş bir tarayıcı panosu göndermeyiz
- Sürüm çalışması CI planlamasına, eklenti zamanlama manifest'lerine veya
  eklenti test matrislerine dokunduysa, onaydan önce `.github/workflows/ci.yml`
  içindeki planner sahipliğindeki `checks-node-extensions` workflow matris çıktılarını yeniden üretin ve gözden geçirin; böylece sürüm notları eski bir CI düzenini açıklamaz
- Stable macOS sürüm hazırlığı, güncelleyici yüzeylerini de içerir:
  - GitHub sürümünde paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` bulunmalıdır
  - `main` üzerindeki `appcast.xml`, yayımlamadan sonra yeni stable zip'i göstermelidir
  - paketlenmiş uygulama, debug olmayan bir bundle id, boş olmayan bir Sparkle feed
    URL'si ve bu sürüm sürümü için kanonik Sparkle derleme tabanına eşit veya ondan yüksek bir `CFBundleVersion`
    korumalıdır

## NPM workflow girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya
  `v2026.4.2-beta.1` gibi gerekli sürüm etiketi; `preflight_only=true` olduğunda,
  yalnızca doğrulama amaçlı ön kontrol için mevcut tam 40 karakterlik `main`
  commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek
  yayımlama yolu için `false`
- `preflight_run_id`: gerçek yayımlama yolunda zorunludur; böylece workflow başarılı ön kontrol çalışmasından hazırlanmış tarball'u yeniden kullanır
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılan olarak `beta`
- `promote_beta_to_latest`: yayımlamayı atlayıp daha önce yayımlanmış
  bir stable `beta` derlemesini `latest` üzerine taşımak için `true`
- `sync_stable_dist_tags`: yayımlamayı atlayıp hem `latest` hem
  de `beta`yı daha önce yayımlanmış bir stable sürüme yöneltmek için `true`

`OpenClaw Release Checks` şu operatör kontrollü girdileri kabul eder:

- `ref`: doğrulanacak mevcut sürüm etiketi veya mevcut tam 40 karakterlik `main` commit
  SHA'sı

Kurallar:

- Stable ve düzeltme etiketleri `beta` veya `latest`'e yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta`'ya yayımlanabilir
- Tam commit SHA girdisine yalnızca `preflight_only=true` olduğunda izin verilir
- Sürüm kontrolleri commit-SHA modu ayrıca mevcut `origin/main` HEAD gerektirir
- Gerçek yayımlama yolu, ön kontrolde kullanılan aynı `npm_dist_tag` değerini kullanmalıdır;
  workflow yayımlama devam etmeden önce bu meta veriyi doğrular
- Yükseltme modu, stable veya düzeltme etiketi, `preflight_only=false`,
  boş bir `preflight_run_id` ve `npm_dist_tag=beta` kullanmalıdır
- Dist-tag eşitleme modu, stable veya düzeltme etiketi,
  `preflight_only=false`, boş bir `preflight_run_id`, `npm_dist_tag=latest`
  ve `promote_beta_to_latest=false` kullanmalıdır
- Yükseltme ve dist-tag eşitleme modları da geçerli bir `NPM_TOKEN` gerektirir çünkü
  `npm dist-tag add` hâlâ normal npm kimlik doğrulaması ister; güvenilir yayımlama
  yalnızca paket yayımlama yolunu kapsar

## Stable npm sürüm sırası

Stable bir npm sürümü çıkarırken:

1. `OpenClaw NPM Release` komutunu `preflight_only=true` ile çalıştırın
   - Bir etiket henüz yokken, ön kontrol workflow'unun yalnızca doğrulama amaçlı kuru çalıştırması için mevcut tam `main` commit SHA'sını kullanabilirsiniz
2. Normal beta öncelikli akış için `npm_dist_tag=beta`, yalnızca
   bilerek doğrudan stable yayımlama istediğinizde `latest` seçin
3. Canlı prompt cache kapsamı istediğinizde `OpenClaw Release Checks`'i aynı etiketle veya
   mevcut tam `main` commit SHA'sıyla ayrı olarak çalıştırın
   - Bu bilinçli olarak ayrıdır; böylece canlı kapsam, uzun süren veya kararsız kontrolleri yayımlama workflow'una yeniden bağlamadan kullanılabilir kalır
4. Başarılı `preflight_run_id` değerini kaydedin
5. `OpenClaw NPM Release` komutunu tekrar `preflight_only=false`, aynı
   `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile çalıştırın
6. Sürüm `beta` üzerinde yayımlandıysa, daha sonra bu
   yayımlanmış derlemeyi `latest`'e taşımak istediğinizde `OpenClaw NPM Release`'i aynı stable
   `tag`, `promote_beta_to_latest=true`, `preflight_only=false`,
   boş `preflight_run_id` ve `npm_dist_tag=beta` ile çalıştırın
7. Sürüm bilerek doğrudan `latest`'e yayımlandıysa ve `beta`
   aynı stable derlemeyi izlemeliyse, `OpenClaw NPM Release`'i aynı
   stable `tag`, `sync_stable_dist_tags=true`, `promote_beta_to_latest=false`,
   `preflight_only=false`, boş `preflight_run_id` ve `npm_dist_tag=latest` ile çalıştırın

Yükseltme ve dist-tag eşitleme modları yine de `npm-release`
ortamı onayı ve bu workflow çalışmasına erişilebilir geçerli bir `NPM_TOKEN` gerektirir.

Bu, hem doğrudan yayımlama yolunu hem de beta öncelikli yükseltme yolunu
belgelenmiş ve operatör tarafından görünür tutar.

## Herkese açık referanslar

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers, gerçek runbook için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel sürüm belgelerini kullanır.
