---
read_when:
    - Пошук визначень публічних каналів випусків
    - Пошук іменування версій і частоти випусків
summary: Публічні канали випусків, іменування версій і частота випусків
title: Політика випусків
x-i18n:
    generated_at: "2026-04-24T04:17:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c752c399ad3df90d54a6582454febbffefff4d785309c756cc3a2ac4c3c24ceb
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні канали випусків:

- stable: теговані випуски, які типово публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: prerelease-теги, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія stable-випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія виправного stable-випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta prerelease: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте провідні нулі до місяця або дня
- `latest` означає поточний promoted stable-випуск npm
- `beta` означає поточну ціль установлення beta
- Stable- і виправні stable-випуски типово публікуються в npm `beta`; оператори випуску можуть явно спрямувати їх у `latest` або пізніше виконати promotion перевіреної beta-збірки
- Кожен stable-випуск OpenClaw постачається разом як npm-пакет і застосунок macOS;
  beta-випуски зазвичай спочатку перевіряють і публікують шлях npm/package, а
  збирання/підписування/notarize застосунку Mac залишаються для stable, якщо це не запитано явно

## Частота випусків

- Випуски спочатку проходять через beta
- Stable слідує лише після перевірки останньої beta
- Мейнтейнери зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано й потрібне виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або перевідтворення старого beta-тега
- Докладна процедура випуску, погодження, облікові дані та примітки щодо відновлення
  доступні лише мейнтейнерам

## Передрелізна перевірка

- Запустіть `pnpm check:test-types` перед передрелізною перевіркою, щоб test TypeScript
  залишався покритим поза швидшим локальним бар’єром `pnpm check`
- Запустіть `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки
  циклів імпорту й меж архітектури були зеленими поза швидшим локальним бар’єром
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти випуску `dist/*` і bundle Control UI існували для кроку
  перевірки пакування
- Запускайте `pnpm release:check` перед кожним тегованим випуском
- Перевірки випуску тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає перевірку паритету QA Lab mock плюс live-
  лейни QA Matrix і Telegram перед погодженням випуску. Live-лейни використовують
  середовище `qa-live-shared`; Telegram також використовує оренду облікових даних Convex CI.
- Крос-ОС перевірка встановлення й оновлення середовища виконання запускається з
  private caller workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний public workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: зберігати реальний шлях випуску npm коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються у
  власному лейні, щоб не затримувати й не блокувати публікацію
- Перевірки випуску потрібно запускати з workflow ref `main` або з
  workflow ref `release/YYYY.M.D`, щоб логіка workflow та секрети залишалися
  контрольованими
- Цей workflow приймає або наявний тег випуску, або поточний повний
  40-символьний commit SHA гілки workflow
- У режимі commit-SHA він приймає лише поточний HEAD гілки workflow; для старіших commit випуску використовуйте
  тег випуску
- Передрелізна перевірка лише для валідації `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний commit SHA гілки workflow без потреби у запушеному тезі
- Цей шлях SHA є лише валідаційним і не може бути promoted у реальну публікацію
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно вимагає реального тега випуску
- Обидва workflow зберігають реальний шлях публікації та promotion на GitHub-hosted
  runners, тоді як незмінювальний шлях валідації може використовувати більші
  Linux-runners Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи обидва workflow-секрети `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm більше не чекає на окремий лейн перевірок випуску
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/виправний тег) перед погодженням
- Після публікації npm запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/виправну версію), щоб перевірити опублікований шлях
  встановлення з реєстру в новому тимчасовому префіксі
- Автоматизація випусків мейнтейнерів тепер використовує preflight-then-promote:
  - реальна публікація npm має пройти успішний npm `preflight_run_id`
  - реальну публікацію npm потрібно запускати з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний запуск preflight
  - stable npm-випуски типово спрямовуються в `beta`
  - stable npm-публікацію можна явно спрямувати в `latest` через вхідні дані workflow
  - mutation npm dist-tag на основі токена тепер розміщується в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, тому що `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    public repo зберігає публікацію лише через OIDC
  - public `macOS Release` є лише валідаційним
  - реальна private mac-публікація має пройти успішні private mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації виконують promotion підготовлених артефактів замість повторного
    їх збирання
- Для виправних stable-випусків на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий шлях оновлення у тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб виправлення випуску не могли непомітно залишити старіші глобальні встановлення на
  базовому stable-пейлоаді
- Передрелізна перевірка npm завершується помилкою за замовчуванням, якщо tarball не містить обидва
  `dist/control-ui/index.html` і непорожній вміст `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню browser dashboard
- Post-publish verification також перевіряє, що опубліковане встановлення з реєстру
  містить непорожні runtime deps вбудованих Plugins у кореневому макеті `dist/*`.
  Випуск, який постачається без цих залежностей або з порожнім їх вмістом,
  не проходить postpublish verifier і не може бути promoted
  до `latest`.
- `pnpm test:install:smoke` також примусово перевіряє бюджет `unpackedSize` для npm pack
  на кандидатному tarball оновлення, щоб installer e2e виявляв випадкове роздуття пакета
  до шляху публікації випуску
- Якщо робота над випуском торкнулася планування CI, manifests часу extension або
  матриць тестів extension, згенеруйте та перевірте належні планувальнику
  виходи матриці workflow `checks-node-extensions` з `.github/workflows/ci.yml`
  перед погодженням, щоб примітки до випуску не описували застарілий макет CI
- Готовність stable-випуску macOS також включає поверхні оновлювача:
  - GitHub-випуск має в підсумку містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має вказувати на новий stable zip після публікації
  - запакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище canonical Sparkle build floor
    для цієї версії випуску

## Вхідні дані workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий тег випуску, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA гілки workflow для передрелізної перевірки лише для валідації
- `preflight_only`: `true` для лише валідації/build/package, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий у реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску preflight
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; типово `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні дані:

- `ref`: наявний тег випуску або поточний повний 40-символьний commit
  SHA `main` для валідації під час запуску з `main`; із гілки випуску використовуйте
  наявний тег випуску або поточний повний 40-символьний commit SHA гілки випуску

Правила:

- Stable- і виправні теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease-теги можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` повний вхід commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` завжди виконує лише валідацію та також приймає
  commit SHA поточної гілки workflow
- Режим commit-SHA для перевірок випуску також вимагає поточний HEAD гілки workflow
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність stable npm-випуску

Під час створення stable npm-випуску:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тега ви можете використати поточний повний commit
     SHA гілки workflow для dry run передрелізної перевірки лише для валідації
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first-потоку або `latest`, лише
   коли ви свідомо хочете прямої stable-публікації
3. Запустіть окремо `OpenClaw Release Checks` з тим самим тегом або
   повним поточним commit SHA гілки workflow, коли вам потрібне live-покриття prompt cache,
   паритету QA Lab, Matrix і Telegram
   - Це окремо навмисно, щоб live-покриття залишалося доступним без
     повторного поєднання довготривалих або нестабільних перевірок із workflow публікації
4. Збережіть успішний `preflight_run_id`
5. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
6. Якщо випуск потрапив у `beta`, використайте private workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб виконати promotion цієї stable-версії з `beta` до `latest`
7. Якщо випуск свідомо було опубліковано відразу в `latest`, а `beta`
   має негайно вказувати на ту саму stable-збірку, використайте той самий private
   workflow, щоб спрямувати обидва dist-tag-и на stable-версію, або дозвольте його запланованій
   self-healing-синхронізації оновити `beta` пізніше

Mutation dist-tag розміщується в private repo з міркувань безпеки, тому що він усе ще
потребує `NPM_TOKEN`, тоді як public repo зберігає публікацію лише через OIDC.

Це дозволяє мати документованими й видимими для операторів і прямий шлях публікації, і beta-first-шлях promotion.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Мейнтейнери використовують private release docs у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали випусків](/uk/install/development-channels)
