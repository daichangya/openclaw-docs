---
read_when:
    - Шукаю визначення публічних каналів випуску
    - Шукаю називання версій і частоту випусків
summary: Публічні канали випуску, називання версій і частота випусків
title: Політика випусків
x-i18n:
    generated_at: "2026-04-24T05:03:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32c6d904e21f6d4150cf061ae27594bc2364f0927c48388362b16d8bf97491dc
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні канали випуску:

- stable: теговані випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: теги попередніх випусків, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Називання версій

- Версія stable-випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-коригувального випуску: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-попереднього випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не доповнюйте місяць або день нулями
- `latest` означає поточний підвищений stable-випуск npm
- `beta` означає поточну ціль встановлення beta
- Stable і stable-коригувальні випуски за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно вибрати `latest` або пізніше підвищити перевірену beta-збірку
- Кожен stable-випуск OpenClaw постачається разом із npm-пакетом і застосунком macOS;
  beta-випуски зазвичай спочатку перевіряють і публікують шлях npm/package, а
  збірка/підпис/нотаризація mac-застосунку залишаються для stable, якщо інше
  не запитано явно

## Частота випусків

- Випуски спочатку проходять через beta
- Stable випускається лише після перевірки останньої beta
- Підтримувачі зазвичай роблять випуски з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано й він потребує виправлення,
  підтримувачі створюють наступний тег `-beta.N` замість видалення або
  перевідтворення старого beta-тега
- Детальна процедура випуску, погодження, облікові дані та нотатки щодо
  відновлення доступні лише підтримувачам

## Передстартова перевірка випуску

- Запустіть `pnpm check:test-types` перед передстартовою перевіркою випуску, щоб
  тестовий TypeScript залишався покритим поза швидшим локальним бар’єром
  `pnpm check`
- Запустіть `pnpm check:architecture` перед передстартовою перевіркою випуску,
  щоб ширші перевірки циклів імпорту та меж архітектури були зеленими поза
  швидшим локальним бар’єром
- Запустіть `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб
  очікувані артефакти випуску `dist/*` і збірка Control UI були наявні для
  кроку перевірки pack
- Запускайте `pnpm release:check` перед кожним тегованим випуском
- Перевірки випуску тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає бар’єр паритету моків QA Lab, а
  також live-канали QA Matrix і Telegram перед погодженням випуску. Live-канали
  використовують середовище `qa-live-shared`; Telegram також використовує
  оренду облікових даних Convex CI.
- Крос-ОС перевірка встановлення, оновлення та виконання запускається з
  приватного caller-workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Такий поділ навмисний: він зберігає реальний шлях npm-випуску коротким,
  детермінованим і сфокусованим на артефактах, тоді як повільніші live-перевірки
  залишаються у власному каналі, щоб не затримувати й не блокувати публікацію
- Перевірки випуску мають запускатися з workflow-ref `main` або з workflow-ref
  `release/YYYY.M.D`, щоб логіка workflow і секрети залишалися контрольованими
- Цей workflow приймає або наявний тег випуску, або поточний повний 40-символьний
  SHA коміту гілки workflow
- У режимі commit-SHA він приймає лише поточний HEAD гілки workflow; для
  старіших комітів випуску використовуйте тег випуску
- Передстартова перевірка лише для валідації `OpenClaw NPM Release` також
  приймає поточний повний 40-символьний SHA коміту гілки workflow без
  необхідності запушеного тега
- Цей шлях SHA призначений лише для валідації та не може бути підвищений до
  реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно потребує реального тега випуску
- Обидва workflow зберігають реальний шлях публікації та підвищення на
  GitHub-hosted runner-ах, тоді як шлях немутувальної валідації може
  використовувати більші Blacksmith Linux runner-и
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням секретів workflow `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передстартова npm-перевірка більше не чекає на окремий канал перевірок випуску
- Запустіть `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/коригувальний тег) перед погодженням
- Після npm-публікації запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/коригувальну версію), щоб перевірити шлях встановлення
  з опублікованого реєстру у свіжому тимчасовому префіксі
- Після beta-публікації запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N pnpm test:docker:npm-telegram-live`
  для перевірки онбордингу встановленого пакета, налаштування Telegram і
  реального Telegram E2E щодо опублікованого npm-пакета.
- Автоматизація випусків підтримувачів тепер використовує схему
  preflight-then-promote:
  - реальна npm-публікація має пройти успішний npm `preflight_run_id`
  - реальна npm-публікація має бути запущена з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний запуск preflight
  - stable npm-випуски за замовчуванням використовують `beta`
  - stable npm-публікація може явно вибирати `latest` через вхід workflow
  - мутація npm dist-tag на основі токена тепер розташована в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`,
    тоді як публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна mac-публікація має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації підвищують підготовлені артефакти замість
    повторної їх збірки
- Для stable-коригувальних випусків, таких як `YYYY.M.D-N`, верифікатор після
  публікації також перевіряє той самий шлях оновлення в тимчасовому префіксі з
  `YYYY.M.D` до `YYYY.M.D-N`, щоб коригувальні випуски не могли непомітно
  залишити старіші глобальні встановлення на базовому stable-корисному
  навантаженні
- Передстартова npm-перевірка завершується з fail closed, якщо tarball не
  містить одночасно `dist/control-ui/index.html` і непорожнє корисне
  навантаження `dist/control-ui/assets/`, щоб ми знову не випустили порожню
  панель браузера
- Перевірка після публікації також перевіряє, що встановлення з опублікованого
  реєстру містить непорожні залежності runtime вбудованих Plugin під
  кореневим макетом `dist/*`. Випуск, який постачається з відсутнім або
  порожнім корисним навантаженням залежностей вбудованого Plugin,
  не проходить postpublish-верифікатор і не може бути підвищений
  до `latest`.
- `pnpm test:install:smoke` також примусово застосовує бюджет `unpackedSize`
  npm pack до tarball кандидата на оновлення, тож installer e2e виявляє
  випадкове роздуття pack ще до шляху публікації випуску
- Якщо робота над випуском торкалася планування CI, маніфестів таймінгів
  extension або матриць тестів extension, перед погодженням згенеруйте й
  перегляньте належні планувальнику виходи матриці workflow
  `checks-node-extensions` з `.github/workflows/ci.yml`, щоб примітки до
  випуску не описували застарілу схему CI
- Готовність stable-випуску macOS також включає поверхні оновлювача:
  - GitHub-випуск має в підсумку містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` після публікації має вказувати на новий stable zip
  - запакований застосунок має зберігати bundle id не для debug, непорожній
    Sparkle feed URL і `CFBundleVersion`, не нижчий за канонічний мінімальний
    поріг збірки Sparkle для цієї версії випуску

## Вхідні параметри NPM workflow

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий тег випуску, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для передстартової перевірки
  лише для валідації
- `preflight_only`: `true` для лише валідації/збірки/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий у реальному шляху публікації, щоб workflow
  повторно використав підготовлений tarball з успішного запуску preflight
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: наявний тег випуску або поточний повний 40-символьний SHA коміту
  `main` для перевірки під час запуску з `main`; із гілки випуску використовуйте
  наявний тег випуску або поточний повний 40-символьний SHA коміту гілки випуску

Правила:

- Stable і коригувальні теги можуть публікуватися або в `beta`, або в `latest`
- Beta-теги попередніх випусків можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` повний вхід commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` завжди призначений лише для валідації і також
  приймає поточний commit SHA гілки workflow
- Режим commit-SHA перевірок випуску також потребує поточного HEAD гілки workflow
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що
  використовувався під час preflight; workflow перевіряє ці метадані перед
  продовженням публікації

## Послідовність stable npm-випуску

Під час створення stable npm-випуску:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тега можна використовувати поточний повний SHA коміту гілки
     workflow для dry run передстартового workflow лише для валідації
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first потоку або `latest`
   лише тоді, коли ви навмисно хочете прямої stable-публікації
3. Окремо запустіть `OpenClaw Release Checks` з тим самим тегом або
   повним поточним SHA коміту гілки workflow, коли вам потрібне покриття
   live prompt cache, паритету QA Lab, Matrix і Telegram
   - Це навмисно винесено окремо, щоб live-покриття залишалося доступним без
     повторного зв’язування довготривалих або нестабільних перевірок із workflow публікації
4. Збережіть успішний `preflight_run_id`
5. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
6. Якщо випуск потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   для підвищення цієї stable-версії з `beta` до `latest`
7. Якщо випуск навмисно було одразу опубліковано в `latest`, а `beta`
   має одразу посилатися на ту саму stable-збірку, використайте той самий
   приватний workflow, щоб спрямувати обидва dist-tag на stable-версію, або
   дозвольте його запланованій self-healing-синхронізації перемістити `beta` пізніше

Мутація dist-tag розміщена в приватному репозиторії з міркувань безпеки,
оскільки вона все ще потребує `NPM_TOKEN`, тоді як публічний репозиторій
зберігає публікацію лише через OIDC.

Це зберігає і шлях прямої публікації, і шлях beta-first-підвищення
задокументованими та видимими для оператора.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Підтримувачі використовують приватну документацію з випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали випуску](/uk/install/development-channels)
