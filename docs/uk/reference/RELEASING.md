---
read_when:
    - Шукаю визначення публічних каналів випусків
    - Шукаю найменування версій і періодичність
summary: Публічні канали випусків, найменування версій і періодичність
title: Політика випусків
x-i18n:
    generated_at: "2026-04-27T01:05:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9243a71dad2336c737a59df092bfbfc2bdab830bc9a09e558f27e0e168e82f29
    source_path: reference/RELEASING.md
    workflow: 15
---

OpenClaw має три публічні гілки випусків:

- stable: теговані випуски, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запитано
- beta: теги попередніх випусків, які публікуються в npm `beta`
- dev: рухома голова `main`

## Найменування версій

- Версія stable-випуску: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія stable-випуску з виправленням: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-попереднього випуску: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі попереду для місяця або дня
- `latest` означає поточний підвищений stable-випуск npm
- `beta` означає поточну ціль встановлення beta
- Stable-випуски та stable-випуски з виправленнями за замовчуванням публікуються в npm `beta`; оператори випуску можуть явно вказати ціль `latest` або підвищити перевірену beta-збірку пізніше
- Кожен stable-випуск OpenClaw постачається разом із npm-пакетом і застосунком для macOS;
  beta-випуски зазвичай спочатку проходять валідацію та публікують шлях npm/package, тоді як збірка/підписання/нотаризація застосунку для macOS зарезервовані для stable, якщо не запитано інше

## Періодичність випусків

- Випуски спочатку проходять через beta
- Stable виходить лише після перевірки останньої beta
- Супроводжувачі зазвичай роблять випуски з гілки `release/YYYY.M.D`, створеної
  з поточного `main`, щоб перевірка випуску та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було запушено або опубліковано й він потребує виправлення, супроводжувачі створюють
  наступний тег `-beta.N` замість видалення або повторного створення старого beta-тега
- Детальна процедура випуску, погодження, облікові дані та нотатки щодо
  відновлення призначені лише для супроводжувачів

## Передрелізна перевірка

- Запускайте `pnpm check:test-types` перед передрелізною перевіркою, щоб типи TypeScript у тестах
  залишалися покритими поза швидшим локальним шлюзом `pnpm check`
- Запускайте `pnpm check:architecture` перед передрелізною перевіркою, щоб ширші
  перевірки циклів імпорту й архітектурних меж були зеленими поза швидшим локальним шлюзом
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти випуску `dist/*` і бандл Control UI існували для кроку
  перевірки пакування
- Запускайте вручну workflow `Full Release Validation` перед погодженням випуску,
  коли потрібен увесь набір перевірки випуску з однієї точки входу. Він
  приймає гілку, тег або повний SHA коміту, запускає вручну `CI` і
  запускає `OpenClaw Release Checks` для smoke-перевірки встановлення, наборів Docker release-path,
  live/E2E, OpenWebUI, QA Lab parity, а також гілок Matrix і Telegram.
  Указуйте `npm_telegram_package_spec` лише після того, як пакет уже опубліковано
  і також має бути виконано Telegram E2E після публікації.
  Приклад: `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запускайте вручну workflow `CI` напряму, коли вам потрібне лише повне стандартне
  покриття CI для кандидата на випуск. Ручні запуски CI обходять обмеження changed
  і примусово запускають Linux Node shards, bundled-plugin shards, channel
  contracts, сумісність із Node 22, `check`, `check-additional`, build smoke,
  перевірки docs, Python Skills, Windows, macOS, Android і гілки Control UI i18n.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke` під час перевірки телеметрії випуску. Команда проганяє
  QA-lab через локальний приймач OTLP/HTTP і перевіряє експортовані назви trace span,
  обмежені атрибути та редагування вмісту/ідентифікаторів без потреби
  в Opik, Langfuse або іншому зовнішньому колекторі.
- Запускайте `pnpm release:check` перед кожним тегованим випуском
- Перевірки випуску тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає шлюз mock parity QA Lab, а також live
  QA-гілки Matrix і Telegram перед погодженням випуску. Live-гілки використовують
  середовище `qa-live-shared`; Telegram також використовує оренду облікових даних Convex CI.
- Крос-ОС перевірка встановлення й оновлення під час виконання запускається з
  приватного викликаючого workflow
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: реальний шлях npm-випуску має залишатися коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються у
  власній гілці, щоб не затримувати й не блокувати публікацію
- Перевірки випуску, що використовують секрети, слід запускати через `Full Release
Validation` або з посилання workflow `main`/release, щоб логіка workflow і
  секрети залишалися під контролем
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  розв’язаний коміт досяжний із гілки OpenClaw або тега випуску
- Передрелізна перевірка лише для валідації в `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без потреби в запушеному тезі
- Цей шлях із SHA призначений лише для валідації й не може бути підвищений до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно вимагає справжнього тега випуску
- Обидва workflow залишають реальний шлях публікації та підвищення на GitHub-hosted
  runners, тоді як незмінний шлях валідації може використовувати більші
  Blacksmith Linux runners
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох секретів workflow: `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- Передрелізна перевірка npm-випуску більше не очікує на окрему гілку перевірок випуску
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний beta/тег виправлення) перед погодженням
- Після публікації в npm запустіть
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну beta/версію виправлення), щоб перевірити опублікований шлях
  встановлення з реєстру в новому тимчасовому префіксі
- Після beta-публікації запустіть `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  щоб перевірити онбординг установленого пакета, налаштування Telegram і справжній Telegram E2E
  для опублікованого npm-пакета з використанням спільного пулу орендованих Telegram-облікових даних.
  Локальні одноразові перевірки супроводжувачів можуть пропустити змінні Convex і передати напряму
  три змінні середовища `OPENCLAW_QA_TELEGRAM_*`.
- Супроводжувачі можуть запускати ту саму перевірку після публікації через GitHub Actions за допомогою
  ручного workflow `NPM Telegram Beta E2E`. Він навмисно доступний лише вручну і
  не запускається при кожному merge.
- Автоматизація випусків у супроводжувачів тепер використовує схему preflight-then-promote:
  - реальна публікація в npm має пройти успішний npm `preflight_run_id`
  - реальна публікація в npm має запускатися з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний запуск передрелізної перевірки
  - stable npm-випуски за замовчуванням публікуються в `beta`
  - stable npm-публікація може явно вказувати ціль `latest` через вхід workflow
  - мутація npm dist-tag на основі токена тепер знаходиться в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для валідації
  - реальна приватна mac-публікація має пройти успішні приватні mac
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації підвищують уже підготовлені артефакти замість того, щоб збирати
    їх знову
- Для stable-випусків із виправленнями на кшталт `YYYY.M.D-N` перевірка після публікації
  також перевіряє той самий шлях оновлення у тимчасовому префіксі з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб виправлення випуску не могли непомітно залишити старіші глобальні встановлення на
  базовому stable-навантаженні
- Передрелізна перевірка npm-випуску завершується із закритою відмовою, якщо tarball не містить і
  `dist/control-ui/index.html`, і непорожнє навантаження `dist/control-ui/assets/`,
  щоб ми знову не випустили порожню панель браузера
- Перевірка після публікації також перевіряє, що опубліковане встановлення з реєстру
  містить непорожні runtime-залежності bundled plugin у кореневому макеті
  `dist/*`. Випуск, який постачається з відсутніми або порожніми
  залежностями bundled plugin, не проходить postpublish verifier і не може бути підвищений
  до `latest`.
- `pnpm test:install:smoke` також примусово перевіряє бюджет `unpackedSize` npm pack для
  tarball кандидата на оновлення, щоб installer e2e виявляв випадкове збільшення пакета
  до шляху публікації випуску
- Якщо робота над випуском зачепила планування CI, маніфести часу виконання extensions або
  матриці тестів extensions, згенеруйте заново й перегляньте виходи матриці workflow
  `checks-node-extensions`, якими володіє planner, із `.github/workflows/ci.yml`
  перед погодженням, щоб нотатки до випуску не описували застарілу структуру CI
- Готовність stable-випуску для macOS також включає поверхні оновлювача:
  - GitHub-випуск має зрештою містити запаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має після публікації вказувати на новий stable zip
  - запакований застосунок має зберігати не-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічної нижньої межі збірки Sparkle
    для цієї версії випуску

## Вхідні параметри workflow NPM

`OpenClaw NPM Release` приймає такі керовані оператором вхідні параметри:

- `tag`: обов’язковий тег випуску, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для передрелізної перевірки лише для валідації
- `preflight_only`: `true` для лише валідації/збирання/пакування, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий для реального шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску передрелізної перевірки
- `npm_dist_tag`: цільовий npm-тег для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі керовані оператором вхідні параметри:

- `ref`: гілка, тег або повний SHA коміту для валідації. Перевірки з секретами
  вимагають, щоб розв’язаний коміт був досяжний із гілки OpenClaw або
  тега випуску.

Правила:

- Stable-теги й теги виправлень можуть публікуватися або в `beta`, або в `latest`
- Beta-теги попередніх випусків можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` введення повного SHA коміту дозволене лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для валідації
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, що й під час передрелізної перевірки;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність stable npm-випуску

Під час створення stable npm-випуску:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - Поки тега ще немає, можна використовувати поточний повний SHA коміту гілки workflow
     для dry run workflow передрелізної перевірки лише для валідації
2. Виберіть `npm_dist_tag=beta` для звичайного потоку beta-first або `latest` лише
   коли ви навмисно хочете прямої stable-публікації
3. Запустіть `Full Release Validation` на гілці випуску, тезі випуску або повному
   SHA коміту, коли потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і Telegram покриття з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований стандартний граф тестів, замість цього запустіть
   ручний workflow `CI` на release ref
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо випуск потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб підвищити цю stable-версію з `beta` до `latest`
8. Якщо випуск навмисно було опубліковано безпосередньо в `latest` і `beta`
   має одразу вказувати на ту саму stable-збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tags на stable-версію, або дозвольте його
   запланованій self-healing синхронізації перемістити `beta` пізніше

Мутація dist-tag знаходиться в приватному репозиторії з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає як шлях прямої публікації, так і шлях підвищення beta-first
задокументованими й видимими для оператора.

Якщо супроводжувачеві доводиться повернутися до локальної npm-автентифікації, будь-які команди 1Password
CLI (`op`) слід запускати лише в окремій tmux-сесії. Не викликайте `op`
напряму з основної оболонки агента; запуск усередині tmux робить підказки,
сповіщення й обробку OTP спостережуваними та запобігає повторним сповіщенням хоста.

## Публічні посилання

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Супроводжувачі використовують приватну документацію випусків у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали випусків](/uk/install/development-channels)
