---
read_when:
    - Шукаю визначення публічних каналів релізів
    - Шукаю назви версій і каденцію
summary: Публічні канали релізів, назви версій і каденція
title: Політика релізів
x-i18n:
    generated_at: "2026-04-24T06:45:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cba6cd02c6fb2380abd8d46e10567af2f96c7c6e45236689d69289348b829ce
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні канали релізів:

- stable: теговані релізи, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: теги попередніх релізів, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Назви версій

- Версія stable-релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-коригувального релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-попереднього релізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі на початку місяця або дня
- `latest` означає поточний просунутий stable-реліз npm
- `beta` означає поточну ціль встановлення beta
- Stable і stable-коригувальні релізи за замовчуванням публікуються в npm `beta`; оператори релізу можуть явно націлити `latest` або пізніше просунути перевірену beta-збірку
- Кожен stable-реліз OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-релізи зазвичай спочатку перевіряють і публікують шлях npm/package, а
  збірка/підпис/нотаризація mac-застосунку зарезервовані для stable, якщо це
  не запитано явно

## Каденція релізів

- Релізи спочатку проходять через beta
- Stable іде лише після перевірки найновішої beta
- Мейнтейнери зазвичай вирізають релізи з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було надіслано або опубліковано й він потребує виправлення,
  мейнтейнери вирізають наступний тег `-beta.N` замість видалення або
  перевідтворення старого beta-тега
- Детальна процедура релізу, погодження, облікові дані й примітки щодо
  відновлення доступні лише для мейнтейнерів

## Передрелізна перевірка

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб
  тестовий TypeScript залишався покритим поза швидшим локальним бар’єром
  `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб
  ширші перевірки циклів імпортів і меж архітектури були зеленими поза
  швидшим локальним бар’єром
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб
  очікувані артефакти релізу `dist/*` і бандл Control UI існували для кроку
  перевірки пакування
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Перевірки релізу тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає бар’єр паритету QA Lab mock, а також
  live-канали QA Matrix і Telegram перед погодженням релізу. Live-канали
  використовують середовище `qa-live-shared`; Telegram також використовує
  оренди облікових даних Convex CI.
- Міжплатформова перевірка встановлення й оновлення під час виконання
  диспетчеризується з приватного workflow-ініціатора
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: зберігати реальний шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки
  лишаються у власному каналі, щоб не затримувати й не блокувати публікацію
- Перевірки релізу мають запускатися з workflow-ref гілки `main` або з
  workflow-ref `release/YYYY.M.D`, щоб логіка workflow і секрети лишалися
  контрольованими
- Цей workflow приймає або наявний тег релізу, або поточний повний
  40-символьний SHA коміту workflow-гілки
- У режимі commit-SHA він приймає лише поточний HEAD workflow-гілки; для
  старіших комітів релізу використовуйте тег релізу
- Передрелізна перевірка лише для валідації `OpenClaw NPM Release` також
  приймає поточний повний 40-символьний SHA коміту workflow-гілки без потреби
  в уже надісланому тегі
- Цей шлях SHA призначений лише для валідації й не може бути просунутий до
  реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно вимагає реального тега релізу
- Обидва workflow зберігають реальний шлях публікації й просування на
  GitHub-hosted runners, тоді як немутуючий шлях валідації може використовувати
  більші Linux-ранери Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох workflow-секретів `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm більше не очікує на окремий канал перевірок релізу
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/коригувальний тег) перед погодженням
- Після публікації в npm запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/коригувальну версію), щоб перевірити опублікований шлях
  встановлення з реєстру в новому тимчасовому префіксі
- Після beta-публікації запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити онбординг установленого пакета, налаштування Telegram і
  реальний Telegram E2E для опублікованого npm-пакета з використанням спільного
  пулу орендованих облікових даних Telegram. Локальні одноразові перевірки
  мейнтейнерів можуть опустити змінні Convex і напряму передати три облікові
  змінні середовища `OPENCLAW_QA_TELEGRAM_*`.
- Мейнтейнери можуть запускати ту саму перевірку після публікації через ручний
  workflow GitHub Actions `NPM Telegram Beta E2E`. Він навмисно лише ручний і
  не запускається на кожному merge.
- Автоматизація релізів мейнтейнерів тепер використовує підхід
  preflight-then-promote:
  - реальна публікація в npm має пройти успішний npm `preflight_run_id`
  - реальна публікація в npm має запускатися з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний передрелізний прогін
  - stable npm-релізи за замовчуванням націлені на `beta`
  - stable npm-публікація може явно націлювати `latest` через вхід workflow
  - мутація npm dist-tag на основі токена тепер знаходиться в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`,
    тоді як публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна mac-публікація має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість їх
    повторної збірки
- Для stable-коригувальних релізів на кшталт `YYYY.M.D-N` перевіряльник після
  публікації також перевіряє той самий шлях оновлення в тимчасовому префіксі з
  `YYYY.M.D` до `YYYY.M.D-N`, щоб коригувальні релізи не могли непомітно
  залишити старі глобальні встановлення на базовому stable-вмісті
- Передрелізна перевірка npm завершується відмовою за замовчуванням, якщо
  tarball не містить і `dist/control-ui/index.html`, і непорожнє корисне
  навантаження `dist/control-ui/assets/`, щоб ми знову не випустили порожню
  браузерну панель керування
- Перевірка після публікації також перевіряє, що опубліковане встановлення з
  реєстру містить непорожні runtime-залежності вбудованих Plugin у кореневому
  макеті `dist/*`. Реліз, який постачається з відсутніми або порожніми
  корисними навантаженнями залежностей вбудованих Plugin, не проходить
  postpublish-перевірку й не може бути просунутий до `latest`.
- `pnpm test:install:smoke` також застосовує бюджет `unpackedSize` для
  кандидатного tarball оновлення npm pack, тож installer e2e виявляє випадкове
  роздуття пакета до шляху публікації релізу
- Якщо робота над релізом торкалася планування CI, маніфестів таймінгів
  розширень або матриць тестів розширень, перед погодженням згенеруйте й
  перегляньте виходи матриці workflow `checks-node-extensions`, якою керує
  planner, з `.github/workflows/ci.yml`, щоб примітки до релізу не описували
  застарілу схему CI
- Готовність stable-релізу macOS також включає поверхні оновлювача:
  - GitHub-реліз має в підсумку містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має після публікації вказувати на новий stable zip
  - запакований застосунок має зберігати недебажний bundle id, непорожній URL
    каналу Sparkle і `CFBundleVersion` на рівні або вище канонічного мінімального
    build floor Sparkle для цієї версії релізу

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі вхідні параметри, керовані оператором:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту workflow-гілки для передрелізної перевірки
  лише з валідацією
- `preflight_only`: `true` для лише валідації/збірки/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий у реальному шляху публікації, щоб workflow
  повторно використав підготовлений tarball з успішного передрелізного прогону
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі вхідні параметри, керовані оператором:

- `ref`: наявний тег релізу або поточний повний 40-символьний SHA коміту
  `main` для перевірки під час запуску з `main`; із гілки релізу використовуйте
  наявний тег релізу або поточний повний 40-символьний SHA коміту гілки релізу

Правила:

- Stable і коригувальні теги можуть публікуватися або в `beta`, або в `latest`
- Beta-теги попередніх релізів можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` повний вхід commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` завжди призначений лише для валідації та також
  приймає поточний SHA коміту workflow-гілки
- Режим commit-SHA перевірок релізу також вимагає поточний HEAD workflow-гілки
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що й
  під час передрелізної перевірки; workflow перевіряє ці метадані перед
  продовженням публікації

## Послідовність stable npm-релізу

Під час вирізання stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тега ви можете використати поточний повний SHA коміту
     workflow-гілки для сухого прогону передрелізного workflow лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first, або `latest`
   лише якщо ви навмисно хочете прямої stable-публікації
3. Запустіть `OpenClaw Release Checks` окремо з тим самим тегом або поточним
   повним SHA коміту workflow-гілки, коли вам потрібне live-покриття prompt
   cache, паритету QA Lab, Matrix і Telegram
   - Це навмисно окремо, щоб live-покриття залишалося доступним без повторного
     прив’язування довгих або нестабільних перевірок до workflow публікації
4. Збережіть успішний `preflight_run_id`
5. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
6. Якщо реліз потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
7. Якщо реліз навмисно було одразу опубліковано в `latest`, а `beta` має одразу
   слідувати за тією самою stable-збіркою, використайте той самий приватний
   workflow, щоб націлити обидва dist-tag на stable-версію, або дозвольте його
   запланованій self-healing синхронізації перемістити `beta` пізніше

Мутація dist-tag винесена в приватний репозиторій з міркувань безпеки, оскільки
вона все ще потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає
публікацію лише через OIDC.

Це дозволяє документувати й робити видимими для операторів як шлях прямої
публікації, так і шлях просування beta-first.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Мейнтейнери використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
