---
read_when:
    - Шукаю визначення публічних каналів релізу
    - Запуск перевірки релізу або приймання пакета
    - Шукаю іменування версій і частоту випусків
summary: Лінії релізу, контрольний список оператора, блоки перевірки, іменування версій і частота випусків
title: Політика релізів
x-i18n:
    generated_at: "2026-04-27T04:12:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b60543b88870f857ab9f043720cc436b07e174673040d2856f5139adb4a5b3d
    source_path: reference/RELEASING.md
    workflow: 15
---

У OpenClaw є три публічні лінії релізу:

- stable: теговані релізи, які за замовчуванням публікуються в npm `beta`, або в npm `latest`, якщо це явно запрошено
- beta: попередні теги релізів, які публікуються в npm `beta`
- dev: рухома вершина `main`

## Іменування версій

- Версія stable-релізу: `YYYY.M.D`
  - Git-тег: `vYYYY.M.D`
- Версія виправного stable-релізу: `YYYY.M.D-N`
  - Git-тег: `vYYYY.M.D-N`
- Версія beta-пререлізу: `YYYY.M.D-beta.N`
  - Git-тег: `vYYYY.M.D-beta.N`
- Не додавайте нулі попереду для місяця або дня
- `latest` означає поточний промотований stable-реліз npm
- `beta` означає поточну ціль встановлення beta
- Stable- і виправні stable-релізи за замовчуванням публікуються в npm `beta`; оператори релізу можуть явно націлити `latest` або пізніше промотувати перевірену beta-збірку
- Кожен stable-реліз OpenClaw постачається разом із npm-пакетом і macOS-застосунком;
  beta-релізи зазвичай спочатку проходять перевірку й публікацію шляху npm/package, а
  збирання/підписування/нотаризація macOS-застосунку зарезервовані для stable, якщо інше не запрошено явно

## Частота випусків релізів

- Релізи спочатку проходять через beta
- Stable іде лише після перевірки останньої beta
- Мейнтейнери зазвичай відгалужують релізи від гілки `release/YYYY.M.D`, створеної
  з поточної `main`, щоб перевірка релізу та виправлення не блокували нову
  розробку в `main`
- Якщо beta-тег уже було відправлено або опубліковано й він потребує виправлення, мейнтейнери створюють
  наступний тег `-beta.N` замість видалення або перевідтворення старого beta-тега
- Детальна процедура релізу, погодження, облікові дані та примітки щодо відновлення
  доступні лише мейнтейнерам

## Контрольний список оператора релізу

Цей контрольний список — це публічна форма процесу релізу. Приватні облікові дані,
підписування, нотаризація, відновлення dist-tag і деталі аварійного відкату
залишаються в закритому runbook релізів для мейнтейнерів.

1. Почніть із поточної `main`: підтягніть останні зміни, підтвердьте, що цільовий коміт уже відправлено,
   і що поточний CI для `main` достатньо зелений, щоб відгалужуватися від нього.
2. Перепишіть верхню секцію `CHANGELOG.md` на основі реальної історії комітів за допомогою
   `/changelog`, залиште записи орієнтованими на користувача, закомітьте їх, відправте і ще раз зробіть rebase/pull перед відгалуженням.
3. Перегляньте записи сумісності релізу в
   `src/plugins/compat/registry.ts` і
   `src/commands/doctor/shared/deprecation-compat.ts`. Видаляйте застарілу
   сумісність лише тоді, коли шлях оновлення залишається покритим, або зафіксуйте, чому вона
   навмисно зберігається.
4. Створіть `release/YYYY.M.D` з поточної `main`; не виконуйте звичайну роботу над релізом
   безпосередньо в `main`.
5. Оновіть версію в кожному обов’язковому місці для запланованого тега, а потім виконайте
   локальний детермінований preflight:
   `pnpm check:test-types`, `pnpm check:architecture`,
   `pnpm build && pnpm ui:build` і `pnpm release:check`.
6. Запустіть `OpenClaw NPM Release` з `preflight_only=true`. До появи тега
   для preflight-перевірки дозволено використовувати повний 40-символьний SHA гілки релізу.
   Збережіть успішний `preflight_run_id`.
7. Запустіть усі передрелізні тести через `Full Release Validation` для
   гілки релізу, тега або повного SHA коміту. Це єдина ручна точка входу
   для чотирьох великих блоків перевірки релізу: Vitest, Docker, QA Lab і Package.
8. Якщо перевірка не пройшла, виправте проблему в гілці релізу і повторно запустіть найменший збійний
   файл, лінію, завдання workflow, профіль пакета, провайдера або список дозволених моделей, який
   підтверджує виправлення. Повторно запускайте повну загальну перевірку лише тоді, коли змінена поверхня
   робить попередні докази неактуальними.
9. Для beta створіть тег `vYYYY.M.D-beta.N`, опублікуйте з npm dist-tag `beta`, а потім виконайте
   post-publish приймання пакета для опублікованого пакета `openclaw@YYYY.M.D-beta.N`
   або `openclaw@beta`. Якщо вже відправлена або опублікована beta потребує виправлення, створіть
   наступний `-beta.N`; не видаляйте й не переписуйте стару beta.
10. Для stable продовжуйте лише після того, як перевірена beta або кандидат у реліз
    має потрібні докази перевірки. Публікація stable в npm повторно використовує успішний
    артефакт preflight через `preflight_run_id`; готовність stable-релізу macOS
    також вимагає упакованих `.zip`, `.dmg`, `.dSYM.zip` і оновленого
    `appcast.xml` у `main`.
11. Після публікації запустіть верифікатор npm після публікації, необов’язковий E2E Telegram
    для опублікованого npm, промотування dist-tag за потреби, нотатки GitHub для релізу/пререлізу
    з повної відповідної секції `CHANGELOG.md`, а також кроки оголошення релізу.

## Preflight релізу

- Запускайте `pnpm check:test-types` перед release preflight, щоб TypeScript для тестів
  залишався покритим поза межами швидшого локального гейта `pnpm check`
- Запускайте `pnpm check:architecture` перед release preflight, щоб ширші перевірки
  циклів імпорту й архітектурних меж були зеленими поза межами швидшого локального гейта
- Запускайте `pnpm build && pnpm ui:build` перед `pnpm release:check`, щоб очікувані
  артефакти релізу `dist/*` і збірка Control UI існували для етапу
  перевірки pack
- Запускайте ручний workflow `Full Release Validation` перед погодженням релізу, щоб
  запустити всі передрелізні блоки перевірки з однієї точки входу. Він приймає гілку,
  тег або повний SHA коміту, викликає ручний `CI` і викликає
  `OpenClaw Release Checks` для перевірки встановлення, приймання пакета, Docker
  наборів release-path, live/E2E, OpenWebUI, паритету QA Lab, Matrix і Telegram.
  Надавайте `npm_telegram_package_spec` лише після того, як пакет уже було
  опубліковано і також має запускатися Telegram E2E після публікації. Приклад:
  `gh workflow run full-release-validation.yml --ref main -f ref=release/YYYY.M.D`
- Запускайте ручний workflow `Package Acceptance`, коли вам потрібен побічний доказ
  для кандидата пакета, поки робота над релізом триває. Використовуйте `source=npm` для
  `openclaw@beta`, `openclaw@latest` або точної версії релізу; `source=ref`,
  щоб запакувати довірену гілку/тег/SHA `package_ref` із поточним
  каркасом `workflow_ref`; `source=url` для HTTPS tarball з обов’язковим
  SHA-256; або `source=artifact` для tarball, завантаженого іншим запуском GitHub
  Actions. Workflow розв’язує кандидата до
  `package-under-test`, повторно використовує планувальник Docker E2E release для цього
  tarball і може за бажанням також запустити Telegram QA для цього самого tarball.
  Приклад: `gh workflow run package-acceptance.yml --ref main -f workflow_ref=main -f source=npm -f package_spec=openclaw@beta -f suite_profile=product`
  Типові профілі:
  - `smoke`: лінії встановлення/каналу/агента, мережі gateway і перезавантаження конфігурації
  - `package`: лінії package/update/plugin без OpenWebUI
  - `product`: профіль package плюс канали MCP, очищення cron/subagent,
    вебпошук OpenAI і OpenWebUI
  - `full`: шматки Docker release-path з OpenWebUI
  - `custom`: точний вибір `docker_lanes` для сфокусованого повторного запуску
- Запускайте ручний workflow `CI` безпосередньо, коли вам потрібне лише повне покриття
  звичайного CI для кандидата релізу. Ручний запуск CI обходить змінене
  звуження області й примусово запускає Linux Node shards, shards bundled-plugin,
  channel contracts, сумісність Node 22, `check`, `check-additional`, build smoke,
  перевірки docs, Python Skills, Windows, macOS, Android і лінії i18n для Control UI.
  Приклад: `gh workflow run ci.yml --ref release/YYYY.M.D`
- Запускайте `pnpm qa:otel:smoke` під час перевірки телеметрії релізу. Він проганяє
  QA-lab через локальний приймач OTLP/HTTP і перевіряє експортовані назви trace span,
  обмежені атрибути та редагування контенту/ідентифікаторів без
  потреби в Opik, Langfuse або іншому зовнішньому колекторі.
- Запускайте `pnpm release:check` перед кожним тегованим релізом
- Перевірки релізу тепер виконуються в окремому ручному workflow:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` також запускає gate паритету макетів QA Lab плюс live
  лінії QA для Matrix і Telegram перед погодженням релізу. Live-лінії використовують
  середовище `qa-live-shared`; Telegram також використовує оренду CI-облікових даних Convex.
- Крос-ОС перевірка встановлення та оновлення під час виконання викликається з
  приватного workflow-джерела
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  який викликає повторно використовуваний публічний workflow
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Цей поділ навмисний: тримати реальний шлях npm-релізу коротким,
  детермінованим і зосередженим на артефактах, тоді як повільніші live-перевірки залишаються у
  власній лінії, щоб вони не затримували й не блокували публікацію
- Перевірки релізу, що містять секрети, слід викликати через `Full Release
Validation` або з workflow ref `main`/release, щоб логіка workflow і
  секрети залишалися контрольованими
- `OpenClaw Release Checks` приймає гілку, тег або повний SHA коміту, якщо
  розв’язаний коміт досяжний з гілки OpenClaw або тега релізу
- Preflight лише для перевірки в `OpenClaw NPM Release` також приймає поточний
  повний 40-символьний SHA коміту гілки workflow без потреби в уже відправленому тезі
- Цей шлях із SHA призначений лише для перевірки і не може бути промотований до реальної публікації
- У режимі SHA workflow синтезує `v<package.json version>` лише для перевірки
  метаданих пакета; реальна публікація все одно потребує справжнього тега релізу
- Обидва workflow залишають реальний шлях публікації та промотування на
  GitHub-hosted runners, тоді як шлях перевірки без мутацій може використовувати
  більші Linux runners Blacksmith
- Цей workflow запускає
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  з використанням обох workflow-секретів `OPENAI_API_KEY` і `ANTHROPIC_API_KEY`
- npm release preflight більше не чекає на окрему лінію перевірок релізу
- Запускайте `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (або відповідний тег beta/виправного релізу) перед погодженням
- Після публікації в npm запускайте
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (або відповідну версію beta/виправного релізу), щоб перевірити шлях
  встановлення з опублікованого реєстру в новому тимчасовому prefix
- Після публікації beta запускайте `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`,
  щоб перевірити онбординг встановленого пакета, налаштування Telegram і реальний Telegram E2E
  для опублікованого npm-пакета з використанням спільного пулу орендованих облікових даних Telegram.
  Для локальних одноразових перевірок мейнтейнер може не вказувати змінні Convex і передати
  три облікові дані середовища `OPENCLAW_QA_TELEGRAM_*` безпосередньо.
- Мейнтейнери можуть запускати ту саму перевірку після публікації через
  ручний workflow `NPM Telegram Beta E2E`. Він навмисно доступний лише вручну і
  не запускається при кожному злитті.
- Автоматизація релізів для мейнтейнерів тепер використовує схему preflight-then-promote:
  - реальна публікація в npm має пройти успішний npm `preflight_run_id`
  - реальна публікація в npm має бути викликана з тієї самої гілки `main` або
    `release/YYYY.M.D`, що й успішний запуск preflight
  - stable-релізи npm за замовчуванням ідуть у `beta`
  - stable-публікація в npm може явно націлювати `latest` через вхід workflow
  - мутація npm dist-tag на основі токена тепер знаходиться в
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    з міркувань безпеки, оскільки `npm dist-tag add` усе ще потребує `NPM_TOKEN`, тоді як
    публічний репозиторій зберігає публікацію лише через OIDC
  - публічний `macOS Release` призначений лише для перевірки
  - реальна приватна публікація для mac має пройти успішні приватні
    `preflight_run_id` і `validate_run_id`
  - реальні шляхи публікації промотують підготовлені артефакти замість їх повторної збірки
- Для виправних stable-релізів на кшталт `YYYY.M.D-N` верифікатор після публікації
  також перевіряє той самий шлях оновлення в тимчасовому prefix з `YYYY.M.D` до `YYYY.M.D-N`,
  щоб виправлення релізу не могли непомітно залишити старіші глобальні встановлення на
  базовому stable-вмісті
- npm release preflight завершується з блокуванням, якщо tarball не містить і `dist/control-ui/index.html`,
  і непорожній вміст `dist/control-ui/assets/`, щоб ми знову не випустили порожню
  інформаційну панель браузера
- Перевірка після публікації також перевіряє, що встановлення з опублікованого реєстру
  містить непорожні runtime-залежності bundled plugin у кореневій
  структурі `dist/*`. Реліз, який постачається з відсутнім або порожнім вмістом
  залежностей bundled plugin, не проходить postpublish verifier і не може бути промотований
  до `latest`.
- `pnpm test:install:smoke` також забезпечує дотримання бюджету `unpackedSize` для npm pack
  у tarball кандидата на оновлення, тож installer e2e виявляє випадкове роздуття pack
  до шляху публікації релізу
- Якщо робота над релізом зачепила планування CI, маніфести таймінгу розширень або
  матриці тестів розширень, перед погодженням згенеруйте й перегляньте
  виходи матриці workflow `checks-node-extensions`, якими володіє планувальник, з `.github/workflows/ci.yml`,
  щоб нотатки релізу не описували застарілу структуру CI
- Готовність stable-релізу macOS також включає поверхні оновлювача:
  - реліз GitHub має в підсумку містити упаковані `.zip`, `.dmg` і `.dSYM.zip`
  - `appcast.xml` у `main` має після публікації вказувати на новий stable zip
  - упакований застосунок має зберігати non-debug bundle id, непорожній Sparkle feed
    URL і `CFBundleVersion` на рівні або вище канонічного мінімального build-рівня Sparkle
    для цієї версії релізу

## Блоки перевірки релізу

`Full Release Validation` — це спосіб, яким оператори запускають усі передрелізні перевірки
з однієї точки входу. Запускайте його з довіреного workflow ref `main` і передавайте гілку релізу,
тег або повний SHA коміту як `ref`:

```bash
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both
```

Workflow розв’язує цільовий ref, викликає ручний `CI` з
`target_ref=<release-ref>`, викликає `OpenClaw Release Checks` і
за потреби також викликає Telegram E2E після публікації, коли
встановлено `npm_telegram_package_spec`. `OpenClaw Release Checks` далі розгалужується на
перевірку встановлення, крос-ОС перевірки релізу, live/E2E покриття Docker release-path,
Package Acceptance, паритет QA Lab, live Matrix і live Telegram. Повний запуск
прийнятний лише тоді, коли підсумок `Full Release Validation` показує `normal_ci` і
`release_checks` як успішні, а будь-який необов’язковий дочірній `npm_telegram` або
успішний, або навмисно пропущений.

Використовуйте ці варіанти залежно від етапу релізу:

```bash
# Перевірити неопубліковану гілку кандидата релізу.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both

# Перевірити точний уже відправлений коміт.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=<40-char-sha> \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both

# Після публікації beta додати Telegram E2E для опублікованого пакета.
gh workflow run full-release-validation.yml \
  --ref main \
  -f ref=release/YYYY.M.D \
  -f workflow_ref=main \
  -f provider=openai \
  -f mode=both \
  -f npm_telegram_package_spec=openclaw@YYYY.M.D-beta.N \
  -f npm_telegram_provider_mode=mock-openai
```

Не використовуйте повну загальну перевірку як перший повторний запуск після сфокусованого виправлення. Якщо один блок
не пройшов, використовуйте збійний дочірній workflow, job, Docker lane, профіль пакета, модель
провайдера або лінію QA для наступного доказу. Повторно запускайте повну загальну перевірку лише тоді, коли
виправлення змінило спільну оркестрацію релізу або зробило попередні докази з усіх блоків неактуальними.

### Vitest

Блок Vitest — це дочірній workflow ручного `CI`. Ручний CI навмисно
обходить звуження області змін і примусово запускає нормальний граф тестування для
кандидата релізу: Linux Node shards, shards bundled-plugin, channel contracts, сумісність Node 22,
`check`, `check-additional`, build smoke, перевірки docs, Python
Skills, Windows, macOS, Android і i18n для Control UI.

Використовуйте цей блок, щоб відповісти на запитання: «чи пройшло дерево вихідного коду повний нормальний набір тестів?»
Він не є тим самим, що перевірка продукту на шляху релізу. Докази, які слід зберігати:

- підсумок `Full Release Validation`, що показує URL викликаного запуску `CI`
- зелений запуск `CI` на точному цільовому SHA
- назви збійних або повільних shards із job CI під час розслідування регресій
- артефакти таймінгу Vitest, такі як `.artifacts/vitest-shard-timings.json`, коли
  запуск потребує аналізу продуктивності

Запускайте ручний CI безпосередньо лише тоді, коли для релізу потрібен детермінований звичайний CI, але
не потрібні блоки Docker, QA Lab, live, cross-OS або package:

```bash
gh workflow run ci.yml --ref main -f target_ref=release/YYYY.M.D
```

### Docker

Блок Docker розташований у `OpenClaw Release Checks` через
`openclaw-live-and-e2e-checks-reusable.yml`, а також через workflow
`install-smoke` у режимі релізу. Він перевіряє кандидата релізу через упаковані
Docker-середовища, а не лише через тести на рівні вихідного коду.

Покриття Docker для релізу включає:

- повну перевірку встановлення з увімкненою повільною перевіркою глобального встановлення Bun
- лінії E2E для репозиторію
- частини Docker release-path: `core`, `package-update` і
  `plugins-integrations`
- покриття OpenWebUI у частині plugins/integrations
- live/E2E набори провайдерів і покриття live-моделей Docker, коли перевірки релізу
  включають live-набори

Використовуйте Docker-артефакти перед повторним запуском. Планувальник release-path завантажує
`.artifacts/docker-tests/` з логами ліній, `summary.json`, `failures.json`,
таймінгами фаз, JSON плану планувальника та командами повторного запуску. Для
сфокусованого відновлення використовуйте `docker_lanes=<lane[,lane]>` у повторно
використовуваному workflow live/E2E замість повторного запуску всіх частин релізу.

### QA Lab

Блок QA Lab також є частиною `OpenClaw Release Checks`. Це релізний gate
агентної поведінки та рівня каналів, окремий від механіки пакетів Vitest і Docker.

Покриття QA Lab для релізу включає:

- gate паритету макетів, який порівнює лінію кандидата OpenAI з базовою лінією Opus 4.6
  за допомогою agentic parity pack
- live-лінію QA для Matrix із середовищем `qa-live-shared`
- live-лінію QA для Telegram з орендою CI-облікових даних Convex
- `pnpm qa:otel:smoke`, коли телеметрія релізу потребує явного локального підтвердження

Використовуйте цей блок, щоб відповісти на запитання: «чи поводиться реліз правильно в QA-сценаріях і
live-потоках каналів?» Під час погодження релізу зберігайте URL артефактів для ліній
паритету, Matrix і Telegram.

### Package

Блок Package — це gate встановлюваного продукту. Він побудований на основі
`Package Acceptance` і резолвера
`scripts/resolve-openclaw-package-candidate.mjs`. Резолвер нормалізує
кандидата до tarball `package-under-test`, який споживається Docker E2E, перевіряє
інвентар пакета, фіксує версію пакета й SHA-256 та тримає ref каркаса workflow окремо від ref джерела пакета.

Підтримувані джерела кандидатів:

- `source=npm`: `openclaw@beta`, `openclaw@latest` або точна версія релізу OpenClaw
- `source=ref`: запакувати довірену гілку, тег або повний SHA коміту `package_ref`
  з вибраним каркасом `workflow_ref`
- `source=url`: завантажити HTTPS `.tgz` з обов’язковим `package_sha256`
- `source=artifact`: повторно використати `.tgz`, завантажений іншим запуском GitHub Actions

`OpenClaw Release Checks` запускає Package Acceptance з `source=ref`,
`package_ref=<release-ref>` і `suite_profile=package`. Цей профіль покриває
контракти встановлення, оновлення та plugin package і є рідною для GitHub
заміною більшості покриття package/update, яке раніше вимагало
Parallels. Крос-ОС перевірки релізу все ще важливі для специфічних для ОС сценаріїв онбордингу,
інсталятора й платформної поведінки, але перевірка продукту package/update має
надавати перевагу Package Acceptance.

Використовуйте ширші профілі Package Acceptance, коли питання релізу стосується
реального встановлюваного пакета:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product
```

Типові профілі пакетів:

- `smoke`: швидкі лінії встановлення пакета/каналу/агента, мережі gateway і
  перезавантаження конфігурації
- `package`: контракти package для встановлення/оновлення/plugin; це типовий варіант
  перевірки релізу
- `product`: `package` плюс канали MCP, очищення cron/subagent, вебпошук OpenAI
  і OpenWebUI
- `full`: частини Docker release-path з OpenWebUI
- `custom`: точний список `docker_lanes` для сфокусованих повторних запусків

Для підтвердження Telegram для кандидата пакета увімкніть `telegram_mode=mock-openai` або
`telegram_mode=live-frontier` у Package Acceptance. Workflow передає
розв’язаний tarball `package-under-test` у лінію Telegram; окремий
workflow Telegram усе ще приймає специфікацію опублікованого npm для перевірок після публікації.

## Вхідні параметри workflow npm

`OpenClaw NPM Release` приймає такі параметри, контрольовані оператором:

- `tag`: обов’язковий тег релізу, наприклад `v2026.4.2`, `v2026.4.2-1` або
  `v2026.4.2-beta.1`; коли `preflight_only=true`, це також може бути поточний
  повний 40-символьний SHA коміту гілки workflow для preflight, призначеного лише для перевірки
- `preflight_only`: `true` лише для перевірки/збірки/пакета, `false` для
  реального шляху публікації
- `preflight_run_id`: обов’язковий для реального шляху публікації, щоб workflow повторно використав
  підготовлений tarball з успішного запуску preflight
- `npm_dist_tag`: цільовий тег npm для шляху публікації; за замовчуванням `beta`

`OpenClaw Release Checks` приймає такі параметри, контрольовані оператором:

- `ref`: гілка, тег або повний SHA коміту для перевірки. Перевірки, що містять секрети,
  вимагають, щоб розв’язаний коміт був досяжний із гілки OpenClaw або
  тега релізу.

Правила:

- Теги stable і виправних релізів можуть публікуватися як у `beta`, так і в `latest`
- Теги beta-пререлізів можуть публікуватися лише в `beta`
- Для `OpenClaw NPM Release` вхідний повний SHA коміту дозволений лише коли
  `preflight_only=true`
- `OpenClaw Release Checks` і `Full Release Validation` завжди
  призначені лише для перевірки
- Реальний шлях публікації має використовувати той самий `npm_dist_tag`, який використовувався під час preflight;
  workflow перевіряє ці метадані перед продовженням публікації

## Послідовність stable npm-релізу

Під час підготовки stable npm-релізу:

1. Запустіть `OpenClaw NPM Release` з `preflight_only=true`
   - До появи тега ви можете використати поточний повний SHA
     коміту гілки workflow для dry run workflow preflight, призначеного лише для перевірки
2. Виберіть `npm_dist_tag=beta` для звичайного beta-first процесу або `latest`, лише
   якщо ви навмисно хочете пряму stable-публікацію
3. Запустіть `Full Release Validation` для гілки релізу, тега релізу або повного
   SHA коміту, коли вам потрібні звичайний CI плюс live prompt cache, Docker, QA Lab,
   Matrix і Telegram покриття з одного ручного workflow
4. Якщо вам навмисно потрібен лише детермінований звичайний граф тестування, натомість запустіть
   ручний workflow `CI` на ref релізу
5. Збережіть успішний `preflight_run_id`
6. Знову запустіть `OpenClaw NPM Release` з `preflight_only=false`, тим самим
   `tag`, тим самим `npm_dist_tag` і збереженим `preflight_run_id`
7. Якщо реліз потрапив у `beta`, використайте приватний workflow
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`,
   щоб промотувати цю stable-версію з `beta` до `latest`
8. Якщо реліз навмисно було одразу опубліковано в `latest` і `beta`
   має негайно вказувати на ту саму stable-збірку, використайте той самий приватний
   workflow, щоб спрямувати обидва dist-tag на stable-версію, або дозвольте його
   запланованій self-healing синхронізації оновити `beta` пізніше

Мутація dist-tag знаходиться в приватному репозиторії з міркувань безпеки, оскільки вона все ще
потребує `NPM_TOKEN`, тоді як публічний репозиторій зберігає публікацію лише через OIDC.

Це зберігає і шлях прямої публікації, і шлях промотування beta-first
задокументованими та видимими для оператора.

Якщо мейнтейнеру доведеться перейти на локальну автентифікацію npm, запускайте будь-які команди
CLI 1Password (`op`) лише в окремій сесії tmux. Не викликайте `op`
безпосередньо з основної оболонки агента; запуск усередині tmux робить запити,
сповіщення й обробку OTP видимими та запобігає повторним сповіщенням хоста.

## Публічні посилання

- [`.github/workflows/full-release-validation.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/full-release-validation.yml)
- [`.github/workflows/package-acceptance.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/package-acceptance.yml)
- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/resolve-openclaw-package-candidate.mjs`](https://github.com/openclaw/openclaw/blob/main/scripts/resolve-openclaw-package-candidate.mjs)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Мейнтейнери використовують приватну документацію релізів у
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
як фактичний runbook.

## Пов’язане

- [Канали релізів](/uk/install/development-channels)
