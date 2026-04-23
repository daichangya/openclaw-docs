---
read_when:
    - Представлення ClawHub новим користувачам
    - Встановлення, пошук або публікація Skills чи Plugin
    - Пояснення прапорців CLI ClawHub і поведінки синхронізації
summary: 'Посібник із ClawHub: публічний реєстр, native-потоки встановлення OpenClaw і робочі процеси CLI ClawHub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-23T23:07:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 887bbf942238e3aee84389aa1c85b31b263144021301de37452522e215a0b1e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub — це публічний реєстр для **Skills і Plugin OpenClaw**.

- Використовуйте native-команди `openclaw`, щоб шукати/встановлювати/оновлювати Skills і встановлювати
  Plugin з ClawHub.
- Використовуйте окремий CLI `clawhub`, коли вам потрібні auth реєстру, публікація, видалення,
  відновлення видаленого або робочі процеси sync.

Сайт: [clawhub.ai](https://clawhub.ai)

## Native-потоки OpenClaw

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Прості специфікації Plugin, безпечні для npm, також перевіряються через ClawHub перед npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Native-команди `openclaw` встановлюють у ваш активний workspace і зберігають
метадані джерела, щоб подальші виклики `update` могли залишатися на ClawHub.

Встановлення Plugin перевіряє сумісність оголошених `pluginApi` і `minGatewayVersion`
до запуску встановлення архіву, тож несумісні host аварійно завершуються на ранньому етапі,
а не встановлюють package частково.

`openclaw plugins install clawhub:...` приймає лише сімейства Plugin, які можна встановити.
Якщо package у ClawHub насправді є Skill, OpenClaw зупиняється й підказує вам
використати `openclaw skills install <slug>`.

## Що таке ClawHub

- Публічний реєстр для Skills і Plugin OpenClaw.
- Версійоване сховище bundle Skills і метаданих.
- Surface виявлення для пошуку, тегів і сигналів використання.

## Як це працює

1. Користувач публікує bundle Skill (файли + метадані).
2. ClawHub зберігає bundle, розбирає метадані й призначає версію.
3. Реєстр індексує Skill для пошуку та виявлення.
4. Користувачі переглядають, завантажують і встановлюють Skills в OpenClaw.

## Що можна робити

- Публікувати нові Skills і нові версії наявних Skills.
- Знаходити Skills за назвою, тегами або пошуком.
- Завантажувати bundle Skills і переглядати їхні файли.
- Повідомляти про Skills, які є шкідливими або небезпечними.
- Якщо ви модератор, приховувати, показувати знову, видаляти або банити.

## Для кого це (зручно для початківців)

Якщо ви хочете додати нові можливості своєму агенту OpenClaw, ClawHub — це найпростіший спосіб знайти й установити Skills. Вам не потрібно знати, як працює бекенд. Ви можете:

- Шукати Skills звичайною мовою.
- Установлювати Skill у свій workspace.
- Оновлювати Skills пізніше однією командою.
- Робити резервну копію власних Skills шляхом публікації.

## Швидкий старт (нетехнічний)

1. Знайдіть те, що вам потрібно:
   - `openclaw skills search "calendar"`
2. Установіть Skill:
   - `openclaw skills install <skill-slug>`
3. Почніть нову сесію OpenClaw, щоб він підхопив новий Skill.
4. Якщо ви хочете публікувати або керувати auth реєстру, також установіть окремий
   CLI `clawhub`.

## Установлення CLI ClawHub

Це потрібно лише для робочих процесів з auth реєстру, таких як publish/sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Як це вбудовується в OpenClaw

Native `openclaw skills install` установлює в каталог `skills/`
активного workspace. `openclaw plugins install clawhub:...` записує звичайне кероване
встановлення Plugin плюс метадані джерела ClawHub для оновлень.

Анонімні встановлення Plugin з ClawHub також аварійно завершуються для приватних package.
Спільнотні або інші неофіційні канали все ще можна встановлювати, але OpenClaw попереджає,
щоб оператори могли перевірити джерело й верифікацію перед увімкненням.

Окремий CLI `clawhub` також установлює Skills до `./skills` у вашому
поточному робочому каталозі. Якщо налаштовано workspace OpenClaw, `clawhub`
перемикається на цей workspace, якщо ви не перевизначите `--workdir` (або
`CLAWHUB_WORKDIR`). OpenClaw завантажує Skills workspace з `<workspace>/skills`
і підхопить їх у **наступній** сесії. Якщо ви вже використовуєте
`~/.openclaw/skills` або bundled Skills, Skills workspace мають пріоритет.

Докладніше про те, як Skills завантажуються, спільно використовуються та
контролюються запобіжниками, див. [Skills](/uk/tools/skills).

## Огляд системи Skills

Skill — це версійований bundle файлів, який навчає OpenClaw виконувати
конкретне завдання. Кожна публікація створює нову версію, а реєстр зберігає
історію версій, щоб користувачі могли перевіряти зміни.

Типовий Skill містить:

- Файл `SKILL.md` з основним описом і використанням.
- Необов’язкові конфігурації, скрипти або допоміжні файли, які використовує Skill.
- Метадані, такі як теги, підсумок і вимоги до встановлення.

ClawHub використовує метадані для виявлення та безпечного відкриття можливостей Skill.
Реєстр також відстежує сигнали використання (наприклад, зірки та завантаження), щоб покращувати
ранжування й видимість.

## Що надає сервіс (можливості)

- **Публічний перегляд** Skills та їхнього вмісту `SKILL.md`.
- **Пошук** на основі embeddings (векторний пошук), а не лише ключових слів.
- **Версіонування** із semver, changelog і тегами (зокрема `latest`).
- **Завантаження** як zip для кожної версії.
- **Зірки та коментарі** для зворотного зв’язку від спільноти.
- **Hooks модерації** для погоджень і аудитів.
- **Зручний для CLI API** для автоматизації та скриптів.

## Безпека та модерація

ClawHub за замовчуванням відкритий. Будь-хто може завантажувати Skills, але для публікації
обліковий запис GitHub має існувати щонайменше один тиждень. Це допомагає сповільнити зловживання, не блокуючи
легітимних учасників.

Повідомлення та модерація:

- Будь-який користувач, який увійшов у систему, може поскаржитися на Skill.
- Причини скарги обов’язкові й записуються.
- Кожен користувач може мати до 20 активних скарг одночасно.
- Skills з більш ніж 3 унікальними скаргами автоматично приховуються за замовчуванням.
- Модератори можуть переглядати приховані Skills, показувати їх знову, видаляти або банити користувачів.
- Зловживання функцією скарг може призвести до бану облікового запису.

Хочете стати модератором? Запитайте в Discord OpenClaw і зв’яжіться з
модератором або супровідником.

## Команди CLI та параметри

Глобальні параметри (застосовуються до всіх команд):

- `--workdir <dir>`: Робочий каталог (типово: поточний каталог; fallback до workspace OpenClaw).
- `--dir <dir>`: Каталог Skills, відносний до workdir (типово: `skills`).
- `--site <url>`: Базовий URL сайту (вхід через браузер).
- `--registry <url>`: Базовий URL API реєстру.
- `--no-input`: Вимкнути запити (неінтерактивний режим).
- `-V, --cli-version`: Вивести версію CLI.

Auth:

- `clawhub login` (потік через браузер) або `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Параметри:

- `--token <token>`: Вставити API-токен.
- `--label <label>`: Мітка, що зберігається для токенів входу через браузер (типово: `CLI token`).
- `--no-browser`: Не відкривати браузер (потрібен `--token`).

Пошук:

- `clawhub search "query"`
- `--limit <n>`: Максимум результатів.

Встановлення:

- `clawhub install <slug>`
- `--version <version>`: Установити конкретну версію.
- `--force`: Перезаписати, якщо папка вже існує.

Оновлення:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Оновити до конкретної версії (лише для одного slug).
- `--force`: Перезаписати, коли локальні файли не відповідають жодній опублікованій версії.

Список:

- `clawhub list` (читає `.clawhub/lock.json`)

Публікація Skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: Slug Skill.
- `--name <name>`: Відображувана назва.
- `--version <version>`: Semver-версія.
- `--changelog <text>`: Текст changelog (може бути порожнім).
- `--tags <tags>`: Теги, розділені комами (типово: `latest`).

Публікація Plugin:

- `clawhub package publish <source>`
- `<source>` може бути локальною папкою, `owner/repo`, `owner/repo@ref` або URL GitHub.
- `--dry-run`: Побудувати точний план публікації без завантаження будь-чого.
- `--json`: Виводити машиночитний результат для CI.
- `--source-repo`, `--source-commit`, `--source-ref`: Необов’язкові перевизначення, коли автовизначення недостатньо.

Видалення/відновлення видаленого (лише власник/адміністратор):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync (сканувати локальні Skills + публікувати нові/оновлені):

- `clawhub sync`
- `--root <dir...>`: Додаткові корені сканування.
- `--all`: Завантажити все без запитів.
- `--dry-run`: Показати, що було б завантажено.
- `--bump <type>`: `patch|minor|major` для оновлень (типово: `patch`).
- `--changelog <text>`: Changelog для неінтерактивних оновлень.
- `--tags <tags>`: Теги, розділені комами (типово: `latest`).
- `--concurrency <n>`: Перевірки реєстру (типово: 4).

## Типові робочі процеси для агентів

### Пошук Skills

```bash
clawhub search "postgres backups"
```

### Завантаження нових Skills

```bash
clawhub install my-skill-pack
```

### Оновлення встановлених Skills

```bash
clawhub update --all
```

### Резервне копіювання ваших Skills (publish або sync)

Для однієї папки Skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Щоб просканувати й зберегти резервну копію багатьох Skills одразу:

```bash
clawhub sync --all
```

### Публікація Plugin із GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Кодові Plugin мають містити потрібні метадані OpenClaw у `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Опубліковані package мають постачати зібраний JavaScript і вказувати `runtimeExtensions`
на цей вивід. Установлення з checkout Git усе ще можуть повертатися до вихідного коду TypeScript,
коли зібраних файлів немає, але зібрані runtime-entry уникають runtime-компіляції TypeScript
у шляхах startup, doctor і завантаження Plugin.

## Розширені деталі (технічні)

### Версіонування та теги

- Кожна публікація створює нову **semver**-версію `SkillVersion`.
- Теги (наприклад, `latest`) вказують на версію; переміщення тегів дає змогу відкотитися.
- Changelog прив’язуються до кожної версії й можуть бути порожніми під час sync або публікації оновлень.

### Локальні зміни проти версій у реєстрі

Оновлення порівнюють локальний вміст Skill із версіями в реєстрі за допомогою хеша вмісту. Якщо локальні файли не відповідають жодній опублікованій версії, CLI запитує підтвердження перед перезаписом (або вимагає `--force` у неінтерактивних запусках).

### Сканування sync і fallback-корені

`clawhub sync` спочатку сканує ваш поточний workdir. Якщо Skills не знайдено, він повертається до відомих застарілих розташувань (наприклад, `~/openclaw/skills` і `~/.openclaw/skills`). Це зроблено для пошуку старіших установлень Skills без додаткових прапорців.

### Сховище та lockfile

- Установлені Skills записуються в `.clawhub/lock.json` у вашому workdir.
- Auth-токени зберігаються у файлі конфігурації CLI ClawHub (перевизначається через `CLAWHUB_CONFIG_PATH`).

### Телеметрія (кількість встановлень)

Коли ви запускаєте `clawhub sync`, увійшовши в систему, CLI надсилає мінімальний snapshot для обчислення кількості встановлень. Ви можете повністю вимкнути це:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Змінні середовища

- `CLAWHUB_SITE`: Перевизначає URL сайту.
- `CLAWHUB_REGISTRY`: Перевизначає URL API реєстру.
- `CLAWHUB_CONFIG_PATH`: Перевизначає місце, де CLI зберігає токен/конфігурацію.
- `CLAWHUB_WORKDIR`: Перевизначає типовий workdir.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Вимикає телеметрію для `sync`.

## Пов’язане

- [Plugin](/uk/tools/plugin)
- [Skills](/uk/tools/skills)
- [Спільнотні Plugin](/uk/plugins/community)
