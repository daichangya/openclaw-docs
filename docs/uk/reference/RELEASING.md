---
read_when:
    - Пошук визначень публічних каналів релізів
    - Пошук іменування версій і частоти випусків
summary: Публічні канали релізів, іменування версій та частота випусків
title: Політика релізів
x-i18n:
    generated_at: "2026-04-26T23:58:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 123e9410e268f4b2a9c16acb2a4c9ff3b5184cd41f678f1a0d28751108f04bfd
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні канали релізів:

- stable: теговані релізи, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: теги попередніх релізів, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія stable-релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-коригувального релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-попереднього релізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте початкові нулі до місяця або дня
- `latest` означає поточний просунутий stable-реліз npm
- `beta` означає поточну ціль встановлення beta
- Stable- і stable-коригувальні релізи за замовчуванням публікуються в npm `beta`; оператори релізу можуть явно націлити `latest` або просунути перевірену beta-збірку пізніше
- Кожен stable-реліз OpenClaw постачається разом як npm-пакет і застосунок macOS;
  beta-релізи зазвичай спочатку перевіряють і публікують шлях npm/package, а
  збірка/підпис/notarize застосунку macOS зарезервовані для stable, якщо це не запитано явно

## Частота релізів

- Релізи спочатку рухаються через beta
- Stable з’являється лише після перевірки останньої beta
- Підтримувачі зазвичай роблять релізи з гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано й потрібне виправлення, підтримувачі створюють
  наступний тег `-beta.N` замість видалення або перевідтворення старого beta-тега
- Детальна процедура релізу, погодження, облікові дані та примітки щодо відновлення
  доступні лише для підтримувачів

## Передрелізна перевірка

- Запускайте `pnpm check:test-types` перед передрелізною перевіркою, щоб TypeScript для тестів
  залишався покритим поза швидшим локальним проходом `pnpm check`
- Запускайте `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші перевірки
  циклів імпорту та архітектурних меж були зеленими поза швидшим локальним проходом
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і збірка Control UI існували для кроку
  перевірки pack
- Запускайте ручний workflow `CI` перед погодженням релізу, коли потрібне повне нормальне
  покриття CI для кандидата на реліз. Ручні запуски CI обходять розумне
  обмеження за зміненими файлами та примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, `check`, `check-additional`, build smoke, docs checks, Python
  skills, Windows, macOS, Android і канали i18n для Control UI.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke` під час перевірки телеметрії релізу. Команда
  проганяє QA-lab через локальний приймач OTLP/HTTP і перевіряє експортовані
  назви trace span, обмежені атрибути та редагування вмісту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому збирачі.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Перевірки релізу тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає parity gate для моків QA Lab плюс live-
  канали QA для Matrix і Telegram перед погодженням релізу. Live-канали використовують
  середовище `qa-live-shared`; Telegram також використовує оренду облікових даних Convex CI.
- Крос-ОС перевірка встановлення та оновлення під час виконання запускається з
  приватного workflow-викликача
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Такий поділ навмисний: справжній шлях npm-релізу має залишатися коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються
  у власному каналі, щоб не затримувати й не блокувати публікацію
- Перевірки релізу потрібно запускати з workflow ref `main` або з
  workflow ref `release/YYYY.M.D`, щоб логіка workflow і секрети залишалися під контролем
- Цей workflow приймає або наявний тег релізу, або поточний повний 40-символьний commit SHA гілки workflow
- У режимі commit-SHA він приймає лише поточний HEAD гілки workflow; для старіших комітів релізу використовуйте
  тег релізу
- Передрелізна перевірка лише для валідації `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний commit SHA гілки workflow без потреби в запушеному тезі
- Цей шлях SHA призначений лише для валідації й не може бути просунутий у справжню публікацію
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки метаданих
  пакета; справжня публікація все одно вимагає реального тега релізу
- Обидва workflow залишають справжній шлях публікації та просування на GitHub-hosted
  runners, тоді як немутуючий шлях валідації може використовувати більші
  Linux runners Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  використовуючи секрети workflow `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm більше не очікує на окремий канал перевірок релізу
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/коригувальний тег) перед погодженням
- Після публікації npm запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/коригувальну версію), щоб перевірити шлях встановлення
  з опублікованого реєстру в новому тимчасовому префіксі
- Після публікації beta запускайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити onboarding встановленого пакета, налаштування Telegram і реальний Telegram E2E
  проти опублікованого npm-пакета, використовуючи спільний пул орендованих облікових даних Telegram.
  Для локальних одноразових перевірок підтримувача можна не вказувати змінні Convex і передати три
  облікові дані env `OPENCLAW_QA_TELEGRAM_*` безпосередньо.
- Підтримувачі можуть запускати ту саму перевірку після публікації з GitHub Actions через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно доступний лише вручну і
  не запускається на кожне злиття.
- Автоматизація релізів підтримувачів тепер використовує підхід preflight-then-promote:
  - справжня публікація в npm має пройти успішний npm `preflight_run_id`
  - справжню публікацію в npm потрібно запускати з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний preflight run
  - stable npm-релізи за замовчуванням націлені на `beta`
  - stable npm publish може явно націлювати `latest` через вхідні параметри workflow
  - мутація npm dist-tag на основі токена тепер знаходиться в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - справжня приватна публікація mac має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - шляхи справжньої публікації просувають підготовлені артефакти замість повторної
    їх збірки
- Для stable-коригувальних релізів на кшталт `YYYY.M.D-N` перевірка після публікації
  також перевіряє той самий шлях оновлення в тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб коригувальні релізи не могли непомітно залишити старі глобальні встановлення на
  базовому stable-навантаженні
- Передрелізна перевірка npm завершується помилкою за замовчуванням, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожнє наповнення `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню браузерну панель
- Перевірка після публікації також перевіряє, що встановлення з опублікованого реєстру
  містить непорожні bundled plugin runtime deps у кореневому макеті `dist/*`.
  Реліз із відсутнім або порожнім наповненням залежностей
  bundled plugin не проходить postpublish verifier і не може бути просунутий
  до `latest`.
- `pnpm test:install:smoke` також примусово перевіряє бюджет `unpackedSize` для npm pack на
  tarball кандидата на оновлення, щоб installer e2e виявляв випадкове роздуття пакета
  до шляху публікації релізу
- Якщо робота над релізом торкалася планування CI, маніфестів часу виконання extension або
  матриць тестів extension, перед погодженням повторно згенеруйте й перегляньте
  виходи матриці workflow `checks-node-extensions`, яким володіє планувальник, з `.github/workflows/ci.yml`,
  щоб примітки до релізу не описували застарілий макет CI
- Готовність stable-релізу macOS також включає поверхні оновлювача:
  - GitHub release має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` після публікації має вказувати на новий stable zip
  - запакований застосунок має зберігати не-debug bundle id, непорожню Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічної нижньої межі збірки Sparkle
    для цієї версії релізу

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі вхідні параметри, керовані оператором:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний commit SHA гілки workflow для передрелізної перевірки лише для валідації
- `preflight_only`: `true` для лише валідації/збірки/пакування, `false` для
  шляху справжньої публікації
- `preflight_run_id`: обов’язковий у шляху справжньої публікації, щоб workflow повторно використав
  підготовлений tarball з успішного preflight run
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі вхідні параметри, керовані оператором:

- `ref`: наявний тег релізу або поточний повний 40-символьний commit
  SHA `main` для перевірки при запуску з `main`; з гілки релізу використовуйте
  наявний тег релізу або поточний повний 40-символьний commit SHA гілки релізу

Правила:

- Stable- і коригувальні теги можуть публікуватися або в `beta`, або в `latest`
- Теги beta-попередніх релізів можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` повний вхід commit SHA дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` завжди призначений лише для валідації та також приймає
  поточний commit SHA гілки workflow
- Режим commit-SHA для перевірок релізу також вимагає поточний HEAD гілки workflow
- Шлях справжньої публікації має використовувати той самий `npm_dist_tag`, що й під час передрелізної перевірки;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність stable npm-релізу

Під час випуску stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тега можна використовувати поточний повний commit
     SHA гілки workflow для dry run передрелізної перевірки лише для валідації
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first потоку або `latest` лише
   якщо ви навмисно хочете прямої stable-публікації
3. Запустіть ручний workflow `CI` на ref релізу, якщо хочете повне нормальне покриття CI
   замість розумного покриття злиття з обмеженням за змінами
4. Окремо запустіть `OpenClaw Release Checks` з тим самим тегом або
   повним поточним commit SHA гілки workflow, якщо хочете live-покриття prompt cache,
   parity QA Lab, Matrix і Telegram
   - Це навмисно окремо, щоб live-покриття залишалося доступним без
     повторного зв’язування довготривалих або нестабільних перевірок із workflow публікації
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний
   workflow `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб просунути цю stable-версію з `beta` до `latest`
8. Якщо реліз навмисно було опубліковано безпосередньо в `latest`, а `beta`
   має відразу вказувати на ту саму stable-збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на stable-версію, або дозвольте його запланованій
   самовідновлюваній синхронізації перемістити `beta` пізніше

Мутація dist-tag знаходиться в приватному репозиторії з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає як прямий шлях публікації, так і beta-first шлях просування
задокументованими й видимими для оператора.

Якщо підтримувачеві доводиться повертатися до локальної автентифікації npm, будь-які команди
1Password CLI (`op`) запускайте лише в окремій tmux-сесії. Не викликайте `op`
безпосередньо з основної оболонки агента; запуск усередині tmux робить prompts,
alerts і обробку OTP спостережуваними та запобігає повторним сповіщенням хоста.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Підтримувачі використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
