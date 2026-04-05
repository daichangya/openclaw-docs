---
read_when:
    - Представлення ClawHub новим користувачам
    - Установлення, пошук або публікація Skills чи plugins
    - Пояснення прапорців ClawHub CLI і поведінки sync
summary: 'Посібник з ClawHub: публічний реєстр, нативні сценарії встановлення OpenClaw і робочі процеси ClawHub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-04-05T18:19:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: e65b3fd770ca96a5dd828dce2dee4ef127268f4884180a912f43d7744bc5706f
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub — це публічний реєстр для **Skills і plugins OpenClaw**.

- Використовуйте нативні команди `openclaw` для пошуку/встановлення/оновлення Skills і встановлення
  plugins з ClawHub.
- Використовуйте окремий CLI `clawhub`, коли потрібні автентифікація реєстру, публікація, видалення,
  відновлення або робочі процеси sync.

Сайт: [clawhub.ai](https://clawhub.ai)

## Нативні сценарії OpenClaw

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

Специфікації plugins у простому npm-safe форматі також перевіряються в ClawHub перед npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Нативні команди `openclaw` встановлюють у ваш активний workspace і зберігають
метадані джерела, щоб подальші виклики `update` могли залишатися в ClawHub.

Під час установлення plugins перевіряється сумісність заявлених `pluginApi` і `minGatewayVersion`
ще до запуску встановлення архіву, тому несумісні хости рано завершуються у безпечний спосіб
замість часткового встановлення пакета.

`openclaw plugins install clawhub:...` приймає лише сімейства plugins, які можна встановити.
Якщо пакет ClawHub насправді є skill, OpenClaw зупиняється і натомість вказує вам на
`openclaw skills install <slug>`.

## Що таке ClawHub

- Публічний реєстр для Skills і plugins OpenClaw.
- Версіоноване сховище пакетів skills і метаданих.
- Поверхня виявлення для пошуку, тегів і сигналів використання.

## Як це працює

1. Користувач публікує пакет skill (файли + метадані).
2. ClawHub зберігає пакет, аналізує метадані та призначає версію.
3. Реєстр індексує skill для пошуку й виявлення.
4. Користувачі переглядають, завантажують і встановлюють Skills в OpenClaw.

## Що можна робити

- Публікувати нові Skills і нові версії наявних Skills.
- Знаходити Skills за назвою, тегами або пошуком.
- Завантажувати пакети skills і переглядати їхні файли.
- Повідомляти про Skills, які є шкідливими або небезпечними.
- Якщо ви модератор, приховувати, показувати, видаляти або банити.

## Для кого це призначено (зручно для початківців)

Якщо ви хочете додати нові можливості своєму агенту OpenClaw, ClawHub — найпростіший спосіб знайти та встановити Skills. Вам не потрібно знати, як працює бекенд. Ви можете:

- Шукати Skills звичайною мовою.
- Установлювати skill у свій workspace.
- Пізніше оновлювати Skills однією командою.
- Робити резервні копії власних Skills через публікацію.

## Швидкий старт (без технічних деталей)

1. Знайдіть те, що вам потрібно:
   - `openclaw skills search "calendar"`
2. Установіть skill:
   - `openclaw skills install <skill-slug>`
3. Запустіть нову сесію OpenClaw, щоб він підхопив новий skill.
4. Якщо ви хочете публікувати або керувати автентифікацією реєстру, також установіть окремий
   CLI `clawhub`.

## Установлення ClawHub CLI

Він потрібен лише для робочих процесів з автентифікацією реєстру, таких як publish/sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Як це вписується в OpenClaw

Нативна команда `openclaw skills install` встановлює в каталог `skills/`
активного workspace. `openclaw plugins install clawhub:...` записує звичайне кероване
встановлення plugin плюс метадані джерела ClawHub для оновлень.

Анонімні встановлення plugins з ClawHub також безпечно завершуються для приватних пакетів.
Спільнота або інші неофіційні канали все ще можуть виконати встановлення, але OpenClaw попереджає,
щоб оператори могли перевірити джерело й валідацію перед увімкненням.

Окремий CLI `clawhub` також установлює Skills у `./skills` у вашому
поточному робочому каталозі. Якщо налаштовано workspace OpenClaw, `clawhub`
перемикається на цей workspace, якщо ви не перевизначите `--workdir` (або
`CLAWHUB_WORKDIR`). OpenClaw завантажує Skills workspace з `<workspace>/skills`
і підхоплює їх у **наступній** сесії. Якщо ви вже використовуєте
`~/.openclaw/skills` або вбудовані Skills, Skills workspace мають пріоритет.

Докладніше про те, як Skills завантажуються, спільно використовуються й обмежуються, див.
у [Skills](/tools/skills).

## Огляд системи Skills

Skill — це версіонований пакет файлів, який навчає OpenClaw виконувати
певне завдання. Кожна публікація створює нову версію, а реєстр зберігає
історію версій, щоб користувачі могли перевіряти зміни.

Типовий skill містить:

- Файл `SKILL.md` з основним описом і використанням.
- Необов’язкові конфігурації, scripts або допоміжні файли, які використовує skill.
- Метадані, такі як теги, summary і вимоги до встановлення.

ClawHub використовує метадані для покращення виявлення та безпечного відкриття можливостей Skills.
Реєстр також відстежує сигнали використання (наприклад, stars і downloads), щоб покращувати
ранжування та видимість.

## Що надає сервіс (можливості)

- **Публічний перегляд** Skills та їхнього вмісту `SKILL.md`.
- **Пошук** на основі embeddings (векторний пошук), а не лише ключових слів.
- **Контроль версій** із semver, changelog-ами й тегами (включно з `latest`).
- **Завантаження** як zip для кожної версії.
- **Stars і comments** для зворотного зв’язку спільноти.
- **Гачки moderation** для схвалень і аудитів.
- **CLI-friendly API** для автоматизації та сценаріїв.

## Безпека та moderation

ClawHub за замовчуванням відкритий. Завантажувати Skills може будь-хто, але для
публікації обліковий запис GitHub має існувати щонайменше один тиждень. Це допомагає стримувати
зловживання, не блокуючи легітимних учасників.

Скарги й moderation:

- Будь-який користувач, який увійшов у систему, може поскаржитися на skill.
- Причини скарги є обов’язковими та записуються.
- Кожен користувач може мати не більше 20 активних скарг одночасно.
- Skills із понад 3 унікальними скаргами типово приховуються автоматично.
- Модератори можуть переглядати приховані Skills, показувати їх знову, видаляти або банити користувачів.
- Зловживання функцією скарг може призвести до бану облікового запису.

Хочете стати модератором? Запитайте в Discord OpenClaw і зв’яжіться з
модератором або супровідником.

## Команди CLI і параметри

Глобальні параметри (застосовуються до всіх команд):

- `--workdir <dir>`: Робочий каталог (типово: поточний каталог; якщо можливо, використовується workspace OpenClaw).
- `--dir <dir>`: Каталог Skills відносно workdir (типово: `skills`).
- `--site <url>`: Базова URL-адреса сайту (вхід через браузер).
- `--registry <url>`: Базова URL-адреса API реєстру.
- `--no-input`: Вимкнути prompts (неінтерактивний режим).
- `-V, --cli-version`: Вивести версію CLI.

Автентифікація:

- `clawhub login` (потік через браузер) або `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Параметри:

- `--token <token>`: Вставити API token.
- `--label <label>`: Мітка, що зберігається для token-ів входу через браузер (типово: `CLI token`).
- `--no-browser`: Не відкривати браузер (потрібен `--token`).

Пошук:

- `clawhub search "query"`
- `--limit <n>`: Максимальна кількість результатів.

Установлення:

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

Публікація skills:

- `clawhub skill publish <path>`
- `--slug <slug>`: Slug skill.
- `--name <name>`: Видиме ім’я.
- `--version <version>`: Версія semver.
- `--changelog <text>`: Текст changelog (може бути порожнім).
- `--tags <tags>`: Теги, розділені комами (типово: `latest`).

Публікація plugins:

- `clawhub package publish <source>`
- `<source>` може бути локальною папкою, `owner/repo`, `owner/repo@ref` або URL GitHub.
- `--dry-run`: Побудувати точний план публікації без фактичного завантаження.
- `--json`: Вивести машинозчитуваний результат для CI.
- `--source-repo`, `--source-commit`, `--source-ref`: Необов’язкові перевизначення, коли автодетекції недостатньо.

Видалення/відновлення (лише owner/admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync (сканування локальних Skills + публікація нових/оновлених):

- `clawhub sync`
- `--root <dir...>`: Додаткові корені сканування.
- `--all`: Завантажити все без prompts.
- `--dry-run`: Показати, що буде завантажено.
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

### Резервне копіювання своїх Skills (publish або sync)

Для окремої папки skill:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Щоб просканувати й зробити резервну копію багатьох Skills одразу:

```bash
clawhub sync --all
```

### Публікація plugin з GitHub

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Plugins коду мають містити обов’язкові метадані OpenClaw у `package.json`:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
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

## Додаткові деталі (технічні)

### Контроль версій і теги

- Кожна публікація створює нову **semver**-версію `SkillVersion`.
- Теги (як-от `latest`) вказують на версію; переміщення тегів дає змогу відкотитися.
- Changelog-и прив’язуються до кожної версії й можуть бути порожніми під час sync або публікації оновлень.

### Локальні зміни проти версій у реєстрі

Оновлення порівнюють локальний вміст skill з версіями в реєстрі за допомогою content hash. Якщо локальні файли не відповідають жодній опублікованій версії, CLI запитує підтвердження перед перезаписом (або вимагає `--force` у неінтерактивних запусках).

### Сканування sync і резервні корені

`clawhub sync` спочатку сканує ваш поточний workdir. Якщо Skills не знайдено, він переходить до відомих застарілих розташувань (наприклад, `~/openclaw/skills` і `~/.openclaw/skills`). Це зроблено, щоб знаходити старі встановлення skills без додаткових прапорців.

### Сховище і lockfile

- Установлені Skills записуються в `.clawhub/lock.json` у вашому workdir.
- Auth tokens зберігаються у файлі конфігурації ClawHub CLI (можна перевизначити через `CLAWHUB_CONFIG_PATH`).

### Телеметрія (кількість установлень)

Коли ви запускаєте `clawhub sync`, будучи в системі, CLI надсилає мінімальний знімок для обчислення кількості встановлень. Це можна повністю вимкнути:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Змінні середовища

- `CLAWHUB_SITE`: Перевизначає URL-адресу сайту.
- `CLAWHUB_REGISTRY`: Перевизначає URL-адресу API реєстру.
- `CLAWHUB_CONFIG_PATH`: Перевизначає місце, де CLI зберігає token/конфігурацію.
- `CLAWHUB_WORKDIR`: Перевизначає типовий workdir.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Вимикає телеметрію для `sync`.
