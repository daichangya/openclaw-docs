---
read_when:
    - Пошук публічних визначень каналів випусків
    - Пошук схеми назв версій і cadence
summary: Публічні канали випусків, схема назв версій і cadence
title: Політика випусків
x-i18n:
    generated_at: "2026-04-05T18:15:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb52a13264c802395aa55404c6baeec5c7b2a6820562e7a684057e70cc85668f
    source_path: reference/RELEASING.md
    workflow: 15
---

# Політика випусків

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які типово публікуються в npm `beta`, або в npm `latest`, якщо це явно запрошено
- beta: теги попередніх випусків, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Схема назв версій

- Версія stable-випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія коригувального stable-випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-попереднього випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте провідні нулі для місяця або дня
- `latest` означає поточний просунутий stable-випуск npm
- `beta` означає поточну ціль встановлення beta
- Stable- і коригувальні stable-випуски типово публікуються в npm `beta`; оператори випусків можуть явно націлити `latest` або пізніше просунути перевірену beta-збірку
- Кожен випуск OpenClaw постачається разом як npm-пакет і програма macOS

## Частота випусків

- Випуски спочатку проходять через beta
- Stable іде лише після перевірки останньої beta
- Детальна процедура випуску, затвердження, облікові дані та примітки щодо відновлення
  доступні лише мейнтейнерам

## Передрелізна перевірка

- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб на кроці
  перевірки pack були наявні очікувані артефакти випуску `dist/*` і bundle Control UI
- Запускайте `pnpm release:check` перед кожним тегованим випуском
- Передрелізна перевірка npm для main-гілки також запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  перед пакуванням tarball, використовуючи секрети workflow `OPENAI_API_KEY` і
  `ANTHROPIC_API_KEY`
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction-тег) перед затвердженням
- Після публікації в npm запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction-версію), щоб перевірити шлях встановлення з опублікованого реєстру
  у свіжому тимчасовому prefix
- Автоматизація випусків для мейнтейнерів тепер використовує підхід preflight-then-promote:
  - реальна публікація в npm має пройти успішний npm `preflight_run_id`
  - stable-випуски npm типово націлені на `beta`
  - stable-публікація npm може явно націлювати `latest` через вхід workflow
  - просування stable npm з `beta` на `latest` усе ще доступне як явний ручний режим у довіреному workflow `OpenClaw NPM Release`
  - цьому режиму просування все ще потрібен дійсний `NPM_TOKEN` у середовищі `npm-release`, оскільки керування npm `dist-tag` відокремлене від trusted publishing
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна публікація mac має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість повторного
    збирання
- Для коригувальних stable-випусків, таких як `YYYY.M.D-N`, постпублікаційний перевіряльник
  також перевіряє той самий шлях оновлення в тимчасовому prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб коригувальні випуски не могли непомітно залишати старі глобальні встановлення
  на базовому stable-payload
- Передрелізна перевірка npm завершується fail-closed, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожній payload `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню браузерну панель керування
- Якщо робота над випуском зачепила планування CI, маніфести часу розширень або швидкі
  матриці тестів, заново згенеруйте й перегляньте вихідні дані матриці workflow
  `checks-fast-extensions`, якими володіє planner, з `.github/workflows/ci.yml`
  перед затвердженням, щоб примітки до випуску не описували застарілу структуру CI
- Готовність stable-випуску macOS також включає поверхні оновлювача:
  - GitHub-випуск має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` після публікації має вказувати на новий stable zip
  - запакована програма має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion`, не нижчий за канонічну межу збірки Sparkle
    для цієї версії випуску

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий тег випуску, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`
- `preflight_only`: `true` лише для перевірки/збирання/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий у реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного передрелізного запуску
- `npm_dist_tag`: цільовий тег npm для шляху публікації; типово `beta`
- `promote_beta_to_latest`: `true`, щоб пропустити публікацію й перемістити вже опубліковану
  stable `beta`-збірку на `latest`

Правила:

- Stable- і correction-теги можуть публікуватися або в `beta`, або в `latest`
- Beta-теги попередніх випусків можуть публікуватися лише в `beta`
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що й під час передрелізної перевірки;
  workflow перевіряє ці метадані до продовження публікації
- Режим просування має використовувати stable- або correction-тег, `preflight_only=false`,
  порожній `preflight_run_id` і `npm_dist_tag=beta`
- Режим просування також потребує дійсного `NPM_TOKEN` у середовищі `npm-release`,
  оскільки `npm dist-tag add` усе ще потребує звичайної npm-автентифікації

## Послідовність stable-випуску npm

Під час створення stable-випуску npm:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first потоку або `latest` лише
   тоді, коли ви свідомо хочете пряму stable-публікацію
3. Збережіть успішний `preflight_run_id`
4. Запустіть `OpenClaw NPM Release` ще раз із `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
5. Якщо випуск потрапив у `beta`, пізніше запустіть `OpenClaw NPM Release` з тим самим
   stable `tag`, `promote_beta_to_latest=true`, `preflight_only=false`,
   порожнім `preflight_run_id` і `npm_dist_tag=beta`, коли захочете перемістити цю
   опубліковану збірку на `latest`

Режим просування все ще потребує затвердження середовища `npm-release` і
дійсного `NPM_TOKEN` у цьому середовищі.

Це дозволяє документувати й робити видимими для оператора як прямий шлях публікації, так і шлях просування beta-first.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Мейнтейнери використовують приватну документацію з випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний робочий посібник.
