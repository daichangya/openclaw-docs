---
read_when:
    - Herkese açık sürüm kanalı tanımlarını arıyorsunuz.
    - Sürüm adlandırmasını ve sıklığını arıyorsunuz.
summary: Herkese açık sürüm kanalları, sürüm adlandırması ve sıklığı
title: Sürüm Politikası
x-i18n:
    generated_at: "2026-04-23T09:10:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# Sürüm Politikası

OpenClaw'un herkese açık üç sürüm şeridi vardır:

- stable: varsayılan olarak npm `beta`'ya yayımlanan, açıkça istendiğinde ise npm `latest`'e yayımlanan etiketli sürümler
- beta: npm `beta`'ya yayımlanan prerelease etiketleri
- dev: `main` dalının hareketli ucu

## Sürüm adlandırması

- Stable sürüm sürümü: `YYYY.M.D`
  - Git etiketi: `vYYYY.M.D`
- Stable düzeltme sürümü: `YYYY.M.D-N`
  - Git etiketi: `vYYYY.M.D-N`
- Beta prerelease sürümü: `YYYY.M.D-beta.N`
  - Git etiketi: `vYYYY.M.D-beta.N`
- Ay veya günü sıfırla doldurmayın
- `latest`, şu an yükseltilmiş stable npm sürümü anlamına gelir
- `beta`, geçerli beta kurulum hedefi anlamına gelir
- Stable ve stable düzeltme sürümleri varsayılan olarak npm `beta`'ya yayımlanır; sürüm operatörleri açıkça `latest`'i hedefleyebilir veya doğrulanmış bir beta derlemesini daha sonra yükseltebilir
- Her stable OpenClaw sürümü npm paketini ve macOS uygulamasını birlikte gönderir;
  beta sürümleri ise açıkça istenmediği sürece normalde önce npm/paket yolunu doğrular ve yayımlar; mac uygulaması derleme/imzalama/noterleştirme stable için ayrılmıştır

## Sürüm sıklığı

- Sürümler önce beta olarak ilerler
- Stable, yalnızca en son beta doğrulandıktan sonra gelir
- Bakımcılar normalde sürümleri, geçerli `main` dalından oluşturulan bir `release/YYYY.M.D` dalından keser; böylece sürüm doğrulaması ve düzeltmeleri `main` üzerindeki yeni geliştirmeleri engellemez
- Bir beta etiketi itilmiş veya yayımlanmışsa ve düzeltme gerekiyorsa, bakımcılar eski beta etiketini silmek veya yeniden oluşturmak yerine bir sonraki `-beta.N` etiketini keser
- Ayrıntılı sürüm prosedürü, onaylar, kimlik bilgileri ve kurtarma notları yalnızca bakımcılara özeldir

## Sürüm ön uçuş kontrolü

- Hızlı yerel `pnpm check` geçidi dışında test TypeScript kapsamı korunmuş kalsın diye sürüm ön uçuş kontrolünden önce `pnpm check:test-types` çalıştırın
- Daha geniş import döngüsü ve mimari sınır kontrolleri hızlı yerel geçidin dışında yeşil kalsın diye sürüm ön uçuş kontrolünden önce `pnpm check:architecture` çalıştırın
- Pack doğrulama adımı için beklenen `dist/*` sürüm artifact'leri ve Control UI paketi mevcut olsun diye `pnpm release:check` öncesinde `pnpm build && pnpm ui:build` çalıştırın
- Her etiketli sürümden önce `pnpm release:check` çalıştırın
- Sürüm kontrolleri artık ayrı bir manuel iş akışında çalışır:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks`, sürüm onayından önce QA Lab sahte parity gate ile canlı
  Matrix ve Telegram QA şeritlerini de çalıştırır. Canlı şeritler
  `qa-live-shared` ortamını kullanır; Telegram ayrıca Convex CI kimlik bilgisi lease'lerini kullanır.
- İşletim sistemleri arası kurulum ve yükseltme çalışma zamanı doğrulaması,
  özel çağıran iş akışı olan
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`
  üzerinden dağıtılır; bu da yeniden kullanılabilir herkese açık iş akışını çağırır:
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Bu ayrım bilinçlidir: gerçek npm sürüm yolunu kısa,
  deterministik ve artifact odaklı tutarken daha yavaş canlı kontrolleri kendi
  şeritlerinde tutmak; böylece yayımlamayı geciktirmez veya engellemezler
- Sürüm kontrolleri `main` iş akışı ref'inden veya
  `release/YYYY.M.D` iş akışı ref'inden tetiklenmelidir; böylece iş akışı mantığı ve sırlar
  denetim altında kalır
- Bu iş akışı, mevcut bir sürüm etiketini veya geçerli tam
  40 karakterli iş akışı dalı commit SHA'sını kabul eder
- Commit-SHA modunda yalnızca geçerli iş akışı dalı HEAD'i kabul edilir;
  eski sürüm commit'leri için bir sürüm etiketi kullanın
- `OpenClaw NPM Release` yalnızca doğrulama amaçlı ön uçuş kontrolü de
  itilmiş bir etiket gerektirmeden geçerli tam 40 karakterli iş akışı dalı commit SHA'sını kabul eder
- Bu SHA yolu yalnızca doğrulama içindir ve gerçek bir yayıma yükseltilemez
- SHA modunda iş akışı, paket meta veri kontrolü için yalnızca
  `v<package.json version>` sentetik etiketini üretir; gerçek yayımlama yine gerçek bir sürüm etiketi gerektirir
- Her iki iş akışı da gerçek yayımlama ve yükseltme yolunu GitHub-hosted
  runner'larda tutar; değişiklik yapmayan doğrulama yolu ise daha büyük
  Blacksmith Linux runner'larını kullanabilir
- Bu iş akışı,
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  komutunu hem `OPENAI_API_KEY` hem de `ANTHROPIC_API_KEY` iş akışı sırlarıyla çalıştırır
- npm sürüm ön uçuş kontrolü artık ayrı sürüm kontrolleri şeridini beklemez
- Onaydan önce
  `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (veya eşleşen beta/düzeltme etiketi) çalıştırın
- npm yayımlandıktan sonra,
  yayımlanan kayıt defteri kurulum yolunu temiz bir geçici önek içinde doğrulamak için
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (veya eşleşen beta/düzeltme sürümü) çalıştırın
- Bakımcı sürüm otomasyonu artık önce ön uçuş sonra yükseltme akışını kullanır:
  - gerçek npm yayımlaması başarılı bir npm `preflight_run_id` geçmelidir
  - gerçek npm yayımlaması, başarılı ön uçuş çalıştırmasıyla aynı `main` veya
    `release/YYYY.M.D` dalından tetiklenmelidir
  - stable npm sürümleri varsayılan olarak `beta` kullanır
  - stable npm yayımlaması iş akışı girdisiyle açıkça `latest`'i hedefleyebilir
  - token tabanlı npm dist-tag değişikliği artık güvenlik için
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    içinde yer alır; çünkü `npm dist-tag add` hâlâ `NPM_TOKEN` gerektirirken
    herkese açık depo yalnızca OIDC yayımlamayı korur
  - herkese açık `macOS Release` yalnızca doğrulama içindir
  - gerçek özel mac yayımlaması başarılı özel mac
    `preflight_run_id` ve `validate_run_id` değerlerini geçmelidir
  - gerçek yayımlama yolları artifact'leri yeniden derlemek yerine hazırlanmış
    artifact'leri yükseltir
- `YYYY.M.D-N` gibi stable düzeltme sürümlerinde, yayımlama sonrası doğrulayıcı
  ayrıca aynı geçici önek yükseltme yolunu `YYYY.M.D` sürümünden `YYYY.M.D-N` sürümüne de kontrol eder; böylece sürüm düzeltmeleri eski global kurulumları temel stable payload üzerinde sessizce bırakamaz
- npm sürüm ön uçuş kontrolü, tarball hem
  `dist/control-ui/index.html` hem de boş olmayan `dist/control-ui/assets/` payload'ı içermedikçe kapalı kalacak şekilde başarısız olur; böylece yine boş bir tarayıcı dashboard göndermeyiz
- Yayımlama sonrası doğrulama ayrıca yayımlanan kayıt defteri kurulumunun
  kök `dist/*` düzeni altında boş olmayan paketli Plugin çalışma zamanı bağımlılıkları içerdiğini de kontrol eder. Eksik veya boş paketli Plugin
  bağımlılık payload'larıyla gönderilen bir sürüm, yayımlama sonrası doğrulayıcıda başarısız olur ve
  `latest`'e yükseltilemez.
- `pnpm test:install:smoke`, aday güncelleme tarball'ı üzerinde npm pack `unpackedSize` bütçesini de zorunlu kılar; böylece installer e2e,
  sürüm yayımlama yolundan önce kazara oluşan pack şişmesini yakalar
- Sürüm çalışması CI planlamasına, extension zamanlama manifest'lerine veya
  extension test matrislerine dokunduysa, onaydan önce
  `.github/workflows/ci.yml` içindeki planlayıcıya ait
  `checks-node-extensions` iş akışı matris çıktısını yeniden üretin ve gözden geçirin; böylece sürüm notları eski bir CI düzenini açıklamaz
- Stable macOS sürüm hazırlığı, güncelleyici yüzeylerini de içerir:
  - GitHub sürümü paketlenmiş `.zip`, `.dmg` ve `.dSYM.zip` dosyalarıyla bitmelidir
  - `main` üzerindeki `appcast.xml`, yayımdan sonra yeni stable zip'i göstermelidir
  - paketlenmiş uygulama hata ayıklama dışı bir bundle id, boş olmayan bir Sparkle feed
    URL'si ve o sürüm için kanonik Sparkle derleme tabanına eşit veya daha yüksek bir `CFBundleVersion` korumalıdır

## NPM iş akışı girdileri

`OpenClaw NPM Release` şu operatör kontrollü girdileri kabul eder:

- `tag`: `v2026.4.2`, `v2026.4.2-1` veya
  `v2026.4.2-beta.1` gibi gerekli sürüm etiketi; `preflight_only=true` olduğunda,
  yalnızca doğrulama amaçlı ön uçuş kontrolü için geçerli tam
  40 karakterli iş akışı dalı commit SHA'sı da olabilir
- `preflight_only`: yalnızca doğrulama/derleme/paketleme için `true`, gerçek yayımlama yolu için `false`
- `preflight_run_id`: gerçek yayımlama yolunda gereklidir; böylece iş akışı
  başarılı ön uçuş çalıştırmasından hazırlanan tarball'ı yeniden kullanır
- `npm_dist_tag`: yayımlama yolu için npm hedef etiketi; varsayılan `beta`

`OpenClaw Release Checks` şu operatör kontrollü girdileri kabul eder:

- `ref`: `main` üzerinden tetiklendiğinde doğrulanacak mevcut sürüm etiketi veya
  geçerli tam 40 karakterli `main` commit SHA'sı; sürüm dalından çalıştırılıyorsa
  mevcut bir sürüm etiketi veya geçerli tam 40 karakterli sürüm dalı commit
  SHA'sı kullanın

Kurallar:

- Stable ve düzeltme etiketleri `beta` veya `latest` olarak yayımlanabilir
- Beta prerelease etiketleri yalnızca `beta` olarak yayımlanabilir
- `OpenClaw NPM Release` için tam commit SHA girdisine yalnızca
  `preflight_only=true` olduğunda izin verilir
- `OpenClaw Release Checks` her zaman yalnızca doğrulama içindir ve ayrıca
  geçerli iş akışı dalı commit SHA'sını kabul eder
- Sürüm kontrolleri commit-SHA modu ayrıca geçerli iş akışı dalı HEAD'ini de gerektirir
- Gerçek yayımlama yolu, ön uçuş sırasında kullanılan aynı `npm_dist_tag` değerini kullanmalıdır;
  iş akışı yayımlama devam etmeden önce bu meta veriyi doğrular

## Stable npm sürüm sırası

Bir stable npm sürümü keserken:

1. `OpenClaw NPM Release` iş akışını `preflight_only=true` ile çalıştırın
   - Bir etiket henüz yoksa, ön uçuş iş akışının yalnızca doğrulama amaçlı kuru çalıştırması için geçerli tam iş akışı dalı commit
     SHA'sını kullanabilirsiniz
2. Normal beta-first akışı için `npm_dist_tag=beta` seçin veya yalnızca doğrudan stable yayımlama istediğinizde `latest` seçin
3. Canlı prompt cache,
   QA Lab parity, Matrix ve Telegram kapsamı istediğinizde, `OpenClaw Release Checks` iş akışını aynı etiket veya
   tam geçerli iş akışı dalı commit SHA'sı ile ayrı olarak çalıştırın
   - Bu bilinçli olarak ayrıdır; böylece canlı kapsam kullanılabilir kalır ve
     uzun çalışan veya flaky kontroller yeniden yayımlama iş akışına bağlanmaz
4. Başarılı `preflight_run_id` değerini kaydedin
5. `OpenClaw NPM Release` iş akışını yeniden `preflight_only=false`, aynı
   `tag`, aynı `npm_dist_tag` ve kaydedilen `preflight_run_id` ile çalıştırın
6. Sürüm `beta` üzerinde kaldıysa, o stable sürümü `beta`'dan `latest`'e yükseltmek için özel
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   iş akışını kullanın
7. Sürüm bilerek doğrudan `latest`'e yayımlandıysa ve `beta`
   hemen aynı stable derlemeyi takip etmeliyse, her iki dist-tag'i de stable sürüme yöneltmek için aynı özel
   iş akışını kullanın veya zamanlanmış
   self-healing eşitlemesinin `beta`yı daha sonra taşımasına izin verin

Dist-tag değişikliği güvenlik nedeniyle özel depoda yaşar; çünkü hâlâ
`NPM_TOKEN` gerektirir, herkese açık depo ise yalnızca OIDC yayımlamayı korur.

Bu, hem doğrudan yayımlama yolunu hem de beta-first yükseltme yolunu
belgelenmiş ve operatör tarafından görünür tutar.

## Herkese açık başvurular

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Bakımcılar, gerçek runbook için
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
içindeki özel sürüm belgelerini kullanır.
