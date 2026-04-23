---
read_when:
    - Пошук визначень публічних каналів випуску
    - Пошук іменування версій і cadence
summary: Публічні канали випуску, іменування версій і cadence
title: Політика випусків
x-i18n:
    generated_at: "2026-04-23T07:12:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: b31a9597d656ef33633e6aa1c1019287f7197bebff1e6b11d572e41c149c7cff
    source_path: reference/RELEASING.md
    workflow: 15
---

# Політика випусків

OpenClaw має три публічні канали випуску:

- stable: позначені тегами випуски, які типово публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: prerelease-теги, які публікуються в npm `beta`
- dev: рухома голова `main`

## Іменування версій

- Версія stable-випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-коригувального випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta prerelease: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте ведучі нулі для місяця або дня
- `latest` означає поточний просунутий stable-випуск npm
- `beta` означає поточну ціль встановлення beta
- Stable і stable-коригувальні випуски типово публікуються в npm `beta`; оператори випуску можуть явно націлитися на `latest` або пізніше просунути перевірену beta-збірку
- Кожен stable-випуск OpenClaw постачається разом як npm-пакет і застосунок macOS;
  beta-випуски зазвичай спочатку перевіряють і публікують шлях npm/package, а
  збірка/підпис/нотаризація mac-застосунку зарезервовані для stable, якщо явно не запитано

## Cadence випусків

- Випуски рухаються beta-first
- Stable слідує лише після перевірки останньої beta
- Мейнтейнери зазвичай створюють випуски з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка випуску й виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже був надісланий або опублікований і потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура випуску, погодження, облікові дані та нотатки з відновлення
  доступні лише мейнтейнерам

## Передстартова перевірка випуску

- Запустіть `pnpm check:test-types` перед передстартовою перевіркою випуску, щоб тестовий TypeScript
  залишався покритим поза швидшим локальним gate `pnpm check`
- Запустіть `pnpm check:architecture` перед передстартовою перевіркою випуску, щоб ширші перевірки
  циклів імпорту та меж архітектури були зеленими поза швидшим локальним gate
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти випуску `dist/*` і bundle Control UI існували для кроку
  перевірки pack
- Запускайте `pnpm release:check` перед кожним випуском із тегом
- Перевірки випуску тепер запускаються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає gate mock parity QA Lab плюс live
  канали QA Matrix і Telegram перед погодженням випуску. Live-канали використовують
  середовище `qa-live-shared`; Telegram також використовує оренду облікових даних Convex CI.
- Валідація середовища виконання встановлення й оновлення між ОС запускається з
  приватного caller-workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: реальний шлях npm-випуску має залишатися коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються
  у власному каналі, щоб не затримувати й не блокувати публікацію
- Перевірки випуску мають запускатися з workflow ref `main` або з
  workflow ref `release/YYYY.M.D`, щоб логіка workflow і секрети залишалися
  контрольованими
- Цей workflow приймає або наявний тег випуску, або поточний повний
  40-символьний commit SHA гілки workflow
- У режимі commit-SHA він приймає лише поточний HEAD гілки workflow; для
  старіших commit випуску використовуйте тег випуску
- Передстартова перевірка лише для валідації `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний commit SHA гілки workflow без вимоги надісланого тега
- Цей шлях SHA є лише валідаційним і не може бути просунутий до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно потребує реального тега випуску
- Обидва workflow залишають реальний шлях публікації та просування на runner-ах GitHub-hosted, тоді як шлях валідації без змін стану може використовувати більші
  Linux runner-и Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи обидва workflow secrets: `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передстартова перевірка npm-випуску більше не чекає на окремий канал перевірок випуску
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/correction-тег) перед погодженням
- Після публікації в npm запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/correction-версію), щоб перевірити опублікований шлях
  встановлення з реєстру в новому тимчасовому префіксі
- Автоматизація випусків мейнтейнерів тепер використовує preflight-then-promote:
  - реальна публікація в npm має пройти успішний npm `preflight_run_id`
  - реальна публікація в npm має запускатися з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний передстартовий запуск
  - stable npm-випуски типово націлюються на `beta`
  - stable npm-публікація може явно націлюватися на `latest` через вхідні дані workflow
  - зміна npm dist-tag на основі токена тепер знаходиться в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, тому що `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` — лише для валідації
  - реальна приватна mac-публікація має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації просувають підготовлені артефакти замість повторної
    їх збірки
- Для stable-коригувальних випусків на кшталт `YYYY.M.D-N` post-publish verifier
  також перевіряє той самий шлях оновлення в тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб коригувальні випуски не могли непомітно залишити старіші глобальні встановлення на
  базовому stable payload
- Передстартова перевірка npm-випуску завершується з відмовою за замовчуванням, якщо tarball не містить і `dist/control-ui/index.html`, і непорожнього payload `dist/control-ui/assets/`,
  щоб ми знову не відправили порожню browser dashboard
- Post-publish verification також перевіряє, що опубліковане встановлення з реєстру
  містить непорожні bundled runtime deps плагінів у кореневому макеті `dist/*`.
  Випуск, який постачається з відсутнім або порожнім payload залежностей
  bundled plugin, не проходить postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також забезпечує бюджет `unpackedSize` для npm pack
  у tarball кандидата на оновлення, щоб e2e інсталятора виявляв випадкове роздуття pack
  до шляху публікації випуску
- Якщо робота над випуском торкалася планування CI, маніфестів timing для extensions або
  матриць тестування extensions, перед погодженням заново згенеруйте й перегляньте
  виходи матриці workflow `checks-node-extensions`, що належать planner-у, з `.github/workflows/ci.yml`,
  щоб примітки до випуску не описували застарілу структуру CI
- Готовність stable-випуску macOS також включає поверхні оновлювача:
  - GitHub release має в підсумку містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має вказувати на новий stable zip після публікації
  - запакований застосунок має зберігати не-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічної нижньої межі Sparkle build
    для цієї версії випуску

## Вхідні дані workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні дані:

- `tag`: обов’язковий тег випуску, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA гілки workflow для передстартової перевірки лише з валідацією
- `preflight_only`: `true` для лише валідації/збірки/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий на реальному шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного передстартового запуску
- `npm_dist_tag`: цільовий npm-tag для шляху публікації; типово `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні дані:

- `ref`: наявний тег випуску або поточний повний 40-символьний commit
  SHA `main`, який потрібно перевірити під час запуску з `main`; із гілки випуску використовуйте
  наявний тег випуску або поточний повний 40-символьний commit
  SHA гілки випуску

Правила:

- Stable і correction-теги можуть публікуватися або в `beta`, або в `latest`
- Beta prerelease-теги можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` повний вхідний commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` завжди є лише валідаційним і також приймає
  поточний commit SHA гілки workflow
- Режим commit-SHA для перевірок випуску також вимагає поточного HEAD гілки workflow
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що використовувався під час preflight;
  workflow перевіряє ці метадані, перш ніж публікація продовжиться

## Послідовність stable npm-випуску

Під час створення stable npm-випуску:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тега ви можете використовувати поточний повний commit
     SHA гілки workflow для dry run передстартового workflow лише з валідацією
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest`, лише
   коли ви навмисно хочете прямий stable-випуск
3. Окремо запустіть `OpenClaw Release Checks` з тим самим тегом або
   повним поточним commit SHA гілки workflow, коли вам потрібне покриття live prompt cache,
   parity QA Lab, Matrix і Telegram
   - Це окремо навмисно, щоб live-покриття залишалося доступним без
     повторного зв’язування довготривалих або нестабільних перевірок із workflow публікації
4. Збережіть успішний `preflight_run_id`
5. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
6. Якщо випуск потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
7. Якщо випуск був навмисно опублікований одразу в `latest`, а `beta`
   має негайно слідувати за тією самою stable-збіркою, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на stable-версію, або дозвольте запланованій
   self-healing синхронізації перемістити `beta` пізніше

Зміна dist-tag живе в приватному репозиторії з міркувань безпеки, тому що вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає і шлях прямої публікації, і шлях просування beta-first
задокументованими та видимими для оператора.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Мейнтейнери використовують приватну документацію випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.
