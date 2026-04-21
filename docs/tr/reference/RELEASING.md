---
read_when:
    - Herkese açık sürüm kanalı tanımlarını arıyorsunuz
    - Sürüm adlandırmasını ve yayın sıklığını arıyorsunuz
summary: Herkese açık sürüm kanalları, sürüm adlandırması ve yayın sıklığı
title: Sürüm Politikası
x-i18n:
    generated_at: "2026-04-21T09:05:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 356844708f6ecdae4acfcce853ce16ae962914a9fdd1cfc38a22ac4c439ba172
    source_path: reference/RELEASING.md
    workflow: 15
---

# Sürüm Politikası

OpenClaw'ın herkese açık üç sürüm hattı vardır:

- stable: varsayılan olarak npm `beta`'ya yayımlanan etiketli sürümler veya açıkça istendiğinde npm `latest`'e
- beta: npm `beta`'ya yayımlanan ön sürüm etiketleri
- dev: `main` dalının hareketli ucu

## Sürüm adlandırması

- Stable sürüm sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Stable düzeltme sürümü sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta ön sürüm sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ay veya günü sıfırla doldurmayın
- `latest`, mevcut yükseltilmiş stable npm sürümü anlamına gelir
- `beta`, mevcut beta kurulum hedefi anlamına gelir
- Stable ve stable düzeltme sürümleri varsayılan olarak npm `beta`'ya yayımlanır; sürüm operatörleri açıkça `latest`'i hedefleyebilir veya doğrulanmış bir beta derlemesini daha sonra yükseltebilir
- Her stable OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte gönderir;
  beta sürümleri normalde önce npm/paket yolunu doğrular ve yayımlar; macOS uygulamasını derleme/imzalama/noter onayı ise açıkça istenmedikçe stable için ayrılır

## Sürüm sıklığı

- Sürümler önce beta'ya gider
- Stable yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde sürümleri geçerli `main` dalından oluşturulan `release/YYYY.M.D` dalından keser; böylece sürüm doğrulaması ve düzeltmeleri `main` üzerindeki yeni geliştirmeyi engellemez
- Bir beta etiketi push edilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa, bakımcılar eski beta etiketini silmek veya yeniden oluşturmak yerine sonraki `-beta.N` etiketini keser
- Ayrıntılı sürüm prosedürü, onaylar, kimlik bilgileri ve kurtarma notları yalnızca bakımcılara yöneliktir

## Sürüm ön uçuşu

- Daha hızlı yerel `pnpm check` geçidi dışında test TypeScript'inin
  kapsanmış kalması için sürüm ön uçuşundan önce `pnpm check:test-types` çalıştırın
- Daha hızlı yerel geçidin dışında daha geniş içe aktarma
  döngüsü ve mimari sınır denetimlerinin yeşil kalması için sürüm ön uçuşundan önce `pnpm check:architecture` çalıştırın
- Beklenen `dist/*` sürüm yapıtlarının ve Control UI paketinin
  paket doğrulama adımı için mevcut olması amacıyla `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın
- Etiketli her sürümden önce `pnpm release:check` çalıştırın
- Sürüm denetimleri artık ayrı bir elle çalıştırılan iş akışında çalışır:
  `OpenClaw Release Checks`
- Çapraz OS kurulum ve yükseltme çalışma zamanı doğrulaması,
  özel çağıran iş akışından
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  dağıtılır; bu iş akışı yeniden kullanılabilir herkese açık iş akışını çağırır:
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Bu ayrım bilinçlidir: gerçek npm sürüm yolunu kısa,
  deterministik ve yapıt odaklı tutarken, daha yavaş canlı denetimler kendi
  hattında kalır, böylece yayını durdurmaz veya engellemez
- Sürüm denetimleri `main` iş akışı başvurusundan veya
  `release/YYYY.M.D` iş akışı başvurusundan dağıtılmalıdır; böylece iş akışı mantığı ve sırlar
  denetim altında kalır
- Bu iş akışı mevcut bir sürüm etiketini veya geçerli tam
  40 karakterlik iş akışı dalı commit SHA'sını kabul eder
- Commit-SHA modunda yalnızca geçerli iş akışı dalı HEAD'i kabul eder;
  daha eski sürüm commit'leri için sürüm etiketi kullanın
- `OpenClaw NPM Release` yalnızca doğrulama ön uçuşu da push edilmiş etiket gerektirmeden
  geçerli tam 40 karakterlik iş akışı dalı commit SHA'sını kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayına yükseltilemez
- SHA modunda iş akışı, paket meta veri denetimi için yalnızca
  `v<package.json version>` sentezler; gerçek yayın yine de gerçek bir sürüm etiketi gerektirir
- Her iki iş akışı da gerçek yayın ve yükseltme yolunu GitHub barındırmalı
  çalıştırıcılarda tutarken, durum değiştirmeyen doğrulama yolu daha büyük
  Blacksmith Linux çalıştırıcılarını kullanabilir
- Bu iş akışı,
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı sırlarını kullanarak çalıştırır
- npm sürüm ön uçuşu artık ayrı sürüm denetimleri hattını beklemez
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  komutunu (veya eşleşen beta/düzeltme etiketini) çalıştırın
- npm yayımından sonra, yeni yayımlanan kayıt defteri
  kurulum yolunu yeni bir geçici önek içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  komutunu (veya eşleşen beta/düzeltme sürümünü) çalıştırın
- Bakımcı sürüm otomasyonu artık ön uçuş-sonra-yükselt yaklaşımını kullanır:
  - gerçek npm yayını başarılı bir npm `preflight_run_id` kontrolünden geçmelidir
  - gerçek npm yayını, başarılı ön uçuş çalıştırmasıyla aynı `main` veya
    `release/YYYY.M.D` dalından dağıtılmalıdır
  - stable npm sürümleri varsayılan olarak `beta`'ya gider
  - stable npm yayını iş akışı girdisi üzerinden açıkça `latest`'i hedefleyebilir
  - token tabanlı npm dist-tag değiştirme artık
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içinde bulunur; güvenlik nedeniyle, çünkü `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken
    herkese açık depo yalnızca OIDC yayımını korur
  - herkese açık `macOS Release` yalnızca doğrulama içindir
  - gerçek özel mac yayını, başarılı özel mac
    `preflight_run_id` ve `validate_run_id` kontrollerinden geçmelidir
  - gerçek yayın yolları, bunları yeniden derlemek yerine hazırlanmış yapıtları yükseltir
- `YYYY.M.D-N` gibi stable düzeltme sürümlerinde, yayım sonrası doğrulayıcı
  aynı geçici önek yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de denetler;
  böylece sürüm düzeltmeleri eski genel kurulumları sessizce
  temel stable yük üzerinde bırakamaz
- npm sürüm ön uçuşu, tar arşivi hem
  `dist/control-ui/index.html` hem de boş olmayan bir `dist/control-ui/assets/` yükü içermedikçe kapalı başarısız olur;
  böylece yeniden boş bir tarayıcı panosu göndermeyiz
- `pnpm test:install:smoke` ayrıca aday güncelleme tar arşivinde npm paket
  `unpackedSize` bütçesini zorlar; böylece kurucu e2e, yanlışlıkla paket şişmesini
  sürüm yayım yolundan önce yakalar
- Sürüm çalışması CI planlamasına, uzantı zamanlama manifestlerine veya
  uzantı test matrislerine dokunduysa, onaydan önce `.github/workflows/ci.yml`
  içindeki planlayıcıya ait `checks-node-extensions` iş akışı matris çıktılarını yeniden oluşturun ve gözden geçirin;
  böylece sürüm notları eski bir CI düzenini açıklamaz
- Stable macOS sürüm hazırlığı, güncelleyici yüzeylerini de içerir:
  - GitHub sürümü paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` dosyalarıyla sonuçlanmalıdır
  - `main` dalındaki `appcast.xml`, yayımdan sonra yeni stable zip'e işaret etmelidir
  - paketlenmiş uygulama, hata ayıklama olmayan bir bundle id, boş olmayan bir Sparkle besleme
    URL'si ve bu sürüm sürümü için kurallı Sparkle derleme tabanına eşit veya daha büyük bir `CFBundleVersion` korumalıdır

## NPM iş akışı girdileri

`OpenClaw NPM Release`, operatör tarafından denetlenen şu girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya
  `v2026.4.2-beta.1` gibi gerekli sürüm etiketi; `preflight_only=true` olduğunda bu ayrıca
  yalnızca doğrulama ön uçuşu için geçerli tam 40 karakterlik iş akışı dalı commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paket için `true`, gerçek
  yayın yolu için `false`
- `preflight_run_id`: gerçek yayın yolunda gereklidir; böylece iş akışı başarılı ön uçuş çalıştırmasından hazırlanmış tar arşivini yeniden kullanır
- `npm_dist_tag`: yayın yolu için npm hedef etiketi; varsayılan `beta`

`OpenClaw Release Checks`, operatör tarafından denetlenen şu girdileri kabul eder:

- `ref`: `main` üzerinden dağıtıldığında doğrulamak için mevcut sürüm etiketi veya
  geçerli tam 40 karakterlik `main` commit SHA'sı; bir sürüm dalından dağıtıldığında
  mevcut bir sürüm etiketi veya geçerli tam 40 karakterlik sürüm dalı commit
  SHA'sı kullanın

Kurallar:

- Stable ve düzeltme etiketleri `beta` veya `latest`'e yayımlanabilir
- Beta ön sürüm etiketleri yalnızca `beta`'ya yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca
  `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` her zaman yalnızca doğrulama içindir ve ayrıca
  geçerli iş akışı dalı commit SHA'sını da kabul eder
- Sürüm denetimleri commit-SHA modu ayrıca geçerli iş akışı dalı HEAD'ini de gerektirir
- Gerçek yayın yolu, ön uçuş sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır;
  iş akışı, yayın devam etmeden önce bu meta veriyi doğrular

## Stable npm sürüm sırası

Stable bir npm sürümü keserken:

1. `preflight_only=true` ile `OpenClaw NPM Release` çalıştırın
   - Henüz bir etiket yoksa, ön uçuş iş akışının yalnızca doğrulama amaçlı kuru çalıştırması için geçerli tam iş akışı dalı commit
     SHA'sını kullanabilirsiniz
2. Normal beta-önce akışı için `npm_dist_tag=beta` seçin veya yalnızca
   doğrudan stable yayın istiyorsanız `latest` seçin
3. Aynı etiketle veya canlı istem önbelleği
   kapsamını istediğinizde tam geçerli iş akışı dalı commit SHA'sıyla ayrı olarak `OpenClaw Release Checks` çalıştırın
   - Bu bilerek ayrıdır; böylece canlı kapsam uzun süren veya kararsız denetimleri yayın iş akışına yeniden bağlamadan kullanılabilir kalır
4. Başarılı `preflight_run_id` değerini kaydedin
5. `preflight_only=false`, aynı
   `tag`, aynı `npm_dist_tag` ve kaydedilmiş `preflight_run_id` ile `OpenClaw NPM Release` iş akışını yeniden çalıştırın
6. Sürüm `beta`'ya indiyse, o stable sürümü `beta`'dan `latest`'e yükseltmek için özel
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   iş akışını kullanın
7. Sürüm bilerek doğrudan `latest`'e yayımlandıysa ve `beta`
   aynı stable derlemeyi hemen izlemeliyse, her iki dist-tag'i de stable sürüme işaret ettirmek için yine aynı özel
   iş akışını kullanın veya zamanlanmış kendi kendini iyileştirme eşzamanlamasının `beta`'yı daha sonra taşımasına izin verin

Dist-tag değiştirme güvenlik nedeniyle özel depoda bulunur; çünkü bu işlem hâlâ
`NPM_TOKEN` gerektirirken, herkese açık depo yalnızca OIDC yayımını korur.

Bu, hem doğrudan yayın yolunu hem de beta-önce yükseltme yolunu
belgelenmiş ve operatör tarafından görünür tutar.

## Herkese açık başvurular

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Bakımcılar, gerçek çalışma kitabı için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel sürüm belgelerini kullanır.
