---
read_when:
    - Пошук визначень публічних каналів релізів
    - Пошук іменування версій і каденції
summary: Публічні канали релізів, іменування версій і каденція
title: Політика релізів
x-i18n:
    generated_at: "2026-04-23T05:16:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 979fd30ec717e107858ff812ef4b46060b9a00a0b5a3c23085d95b8fb81723b8
    source_path: reference/RELEASING.md
    workflow: 15
---

# Політика релізів

OpenClaw має три публічні гілки релізів:

- stable: теговані релізи, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: теги попередніх релізів, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія stable-релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія виправного stable-релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-пререлізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі на початку місяця або дня
- `latest` означає поточний просунутий stable-реліз npm
- `beta` означає поточну ціль установлення beta
- Stable-релізи та виправні stable-релізи за замовчуванням публікуються в npm `beta`; оператори релізів можуть явно націлити `latest` або пізніше просунути перевірену beta-збірку
- Кожен stable-реліз OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-релізи зазвичай спочатку перевіряють і публікують шлях npm/package, а
  збирання/підписування/нотаризація застосунку macOS зарезервовані для stable, якщо явно не запитано інше

## Каденція релізів

- Релізи рухаються за схемою beta-first
- Stable з’являється лише після перевірки найновішої beta
- Мейнтейнери зазвичай роблять релізи з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано й потрібне виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або перевідтворення старого beta-тега
- Детальна процедура релізу, погодження, облікові дані та примітки щодо відновлення
  доступні лише мейнтейнерам

## Передрелізна перевірка

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб покриття
  тестового TypeScript зберігалося поза швидшою локальною перевіркою `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші
  перевірки циклів імпортів і меж архітектури були зеленими поза швидшою локальною перевіркою
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і бандл Control UI існували для кроку
  перевірки pack
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Перевірки релізу тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає ворота паритету макетів QA Lab плюс
  live-гілки QA для Matrix і Telegram перед погодженням релізу. Live-гілки використовують
  середовище `qa-live-shared`; Telegram також використовує оренду облікових даних Convex CI.
- Крос-ОС перевірка виконання встановлення та оновлення надсилається з
  приватного caller-workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: зберегти реальний шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються у
  власній гілці, щоб вони не затримували й не блокували публікацію
- Перевірки релізу потрібно запускати з workflow-ref `main` або з
  workflow-ref `release/YYYY.M.D`, щоб логіка workflow і секрети залишалися
  контрольованими
- Цей workflow приймає або наявний тег релізу, або поточний повний
  40-символьний commit SHA гілки workflow
- У режимі commit-SHA він приймає лише поточний HEAD гілки workflow; для
  старіших комітів релізу використовуйте тег релізу
- Передрелізна перевірка лише для валідації `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний commit SHA гілки workflow без вимоги запушеного тега
- Цей шлях через SHA призначений лише для валідації й не може бути просунутий до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно вимагає реального тега релізу
- Обидва workflow зберігають реальний шлях публікації та просування на GitHub-hosted
  runners, тоді як немутаційний шлях валідації може використовувати більші
  Linux-runners від Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи обидва секрети workflow: `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm-релізу більше не очікує на окрему гілку перевірок релізу
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/виправний тег) перед погодженням
- Після публікації npm запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/виправну версію), щоб перевірити опублікований шлях
  установлення з реєстру в новому тимчасовому prefix
- Автоматизація релізів мейнтейнерів тепер використовує схему preflight-then-promote:
  - реальна публікація в npm повинна пройти успішний npm `preflight_run_id`
  - реальна публікація в npm повинна бути запущена з тієї ж гілки `main` або
    `release/YYYY.M.D`, що й успішний передрелізний запуск
  - stable-релізи npm за замовчуванням націлені на `beta`
  - stable-публікація npm може явно націлювати `latest` через вхід workflow
  - мутація npm dist-tag на основі токена тепер розміщена в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна публікація mac повинна пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість їх повторного збирання
- Для виправних stable-релізів, таких як `YYYY.M.D-N`, засіб перевірки після публікації
  також перевіряє той самий шлях оновлення в тимчасовому prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб виправлення релізу не могли непомітно залишити старіші глобальні встановлення на
  базовому stable-корисному навантаженні
- Передрелізна перевірка npm-релізу завершується з відмовою за замовчуванням, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожнього вмісту `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню панель керування в браузері
- `pnpm test:install:smoke` також забезпечує дотримання бюджету `unpackedSize` для npm pack
  на кандидатному tarball оновлення, тож e2e інсталятора виявляє випадкове
  роздуття pack до шляху публікації релізу
- Якщо робота над релізом торкалася планування CI, маніфестів таймінгів розширень або
  матриць тестів розширень, згенеруйте заново й перегляньте належні планувальнику
  результати матриці workflow `checks-node-extensions` із `.github/workflows/ci.yml`
  перед погодженням, щоб примітки до релізу не описували застарілу структуру CI
- Готовність stable-релізу macOS також охоплює поверхні оновлювача:
  - GitHub-реліз повинен у підсумку містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` після публікації повинен вказувати на новий stable zip
  - запакований застосунок повинен зберігати не-debug bundle id, непорожню Sparkle feed
    URL і `CFBundleVersion` на рівні або вище за канонічну мінімальну межу збірки Sparkle
    для цієї версії релізу

## Входи workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором входи:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1`, або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA гілки workflow для передрелізної перевірки лише для валідації
- `preflight_only`: `true` для лише валідації/збирання/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного передрелізного запуску
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі керовані оператором входи:

- `ref`: наявний тег релізу або поточний повний 40-символьний commit
  SHA `main` для валідації при запуску з `main`; із гілки релізу використовуйте
  наявний тег релізу або поточний повний 40-символьний commit
  SHA гілки релізу

Правила:

- Stable- і виправні теги можуть публікуватися або в `beta`, або в `latest`
- Beta-теги попередніх релізів можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` повний вхід commit SHA дозволено лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` завжди призначений лише для валідації й також приймає
  поточний commit SHA гілки workflow
- Режим commit-SHA для перевірок релізу також вимагає поточного HEAD гілки workflow
- Реальний шлях публікації повинен використовувати той самий `npm_dist_tag`, який використовувався під час передрелізної перевірки;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність stable npm-релізу

Під час випуску stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тега ви можете використовувати поточний повний commit
     SHA гілки workflow для dry run передрелізного workflow лише для валідації
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   коли ви свідомо хочете прямої stable-публікації
3. Окремо запустіть `OpenClaw Release Checks` з тим самим тегом або
   повним поточним commit SHA гілки workflow, коли вам потрібне покриття live prompt cache,
   паритету QA Lab, Matrix і Telegram
   - Це навмисно винесено окремо, щоб live-покриття залишалося доступним без
     повторного зв’язування довготривалих або нестабільних перевірок із workflow публікації
4. Збережіть успішний `preflight_run_id`
5. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
6. Якщо реліз потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
7. Якщо реліз навмисно був опублікований одразу в `latest`, а `beta`
   має одразу наслідувати ту саму stable-збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на stable-версію, або дозвольте його запланованій
   самовідновлювальній синхронізації перемістити `beta` пізніше

Мутація dist-tag розміщена в приватному репозиторії з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає як шлях прямої публікації, так і шлях beta-first просування
задокументованими та видимими для операторів.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Мейнтейнери використовують приватну документацію з релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.
