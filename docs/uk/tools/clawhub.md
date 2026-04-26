---
read_when:
    - Пошук, встановлення або оновлення Skills чи Plugin
    - Публікація Skills або Plugin у реєстрі
    - Налаштування CLI clawhub або його перевизначень через середовище
sidebarTitle: ClawHub
summary: 'ClawHub: публічний реєстр Skills і Plugin для OpenClaw, нативні потоки встановлення та CLI clawhub'
title: ClawHub
x-i18n:
    generated_at: "2026-04-26T07:03:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub — це публічний реєстр для **Skills і Plugin OpenClaw**.

- Використовуйте нативні команди `openclaw` для пошуку, встановлення та оновлення Skills, а також для встановлення Plugin із ClawHub.
- Використовуйте окремий CLI `clawhub` для автентифікації в реєстрі, публікації, видалення/відновлення та робочих процесів синхронізації.

Сайт: [clawhub.ai](https://clawhub.ai)

## Швидкий старт

<Steps>
  <Step title="Пошук">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Установлення">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Використання">
    Почніть нову сесію OpenClaw — вона підхопить новий Skill.
  </Step>
  <Step title="Публікація (необов’язково)">
    Для робочих процесів з автентифікацією в реєстрі (публікація, синхронізація, керування) установіть
    окремий CLI `clawhub`:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Нативні потоки OpenClaw

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Нативні команди `openclaw` установлюють у ваш активний робочий простір і
    зберігають метадані джерела, щоб подальші виклики `update` могли лишатися на ClawHub.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Прості специфікації Plugin, безпечні для npm, також спочатку перевіряються в ClawHub, а вже потім у npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Під час установлення Plugin перевіряється сумісність заявлених `pluginApi` і
    `minGatewayVersion` до запуску встановлення архіву, тож
    несумісні хости безпечно завершуються раніше, замість часткового встановлення
    пакета.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` приймає лише інстальовні сімейства Plugin. Якщо пакет ClawHub насправді є Skill, OpenClaw зупиняється й натомість
вказує на `openclaw skills install <slug>`.

Анонімні встановлення Plugin з ClawHub також безпечно завершуються помилкою для приватних пакетів.
Канали спільноти або інші неофіційні канали все ще можуть встановлюватися, але OpenClaw
показує попередження, щоб оператори могли перевірити джерело й перевірку перед
увімкненням.
</Note>

## Що таке ClawHub

- Публічний реєстр для Skills і Plugin OpenClaw.
- Версіоноване сховище наборів Skills і метаданих.
- Поверхня виявлення для пошуку, тегів і сигналів використання.

Типовий Skill — це версіонований набір файлів, який містить:

- Файл `SKILL.md` з основним описом і способом використання.
- Необов’язкові конфігурації, скрипти або допоміжні файли, які використовує Skill.
- Метадані, як-от теги, підсумок і вимоги до встановлення.

ClawHub використовує метадані для підтримки пошуку та безпечного відкриття
можливостей Skill. Реєстр відстежує сигнали використання (зірки, завантаження), щоб
поліпшувати ранжування та видимість. Кожна публікація створює нову
semver-версію, а реєстр зберігає історію версій, щоб користувачі могли перевіряти
зміни.

## Робочий простір і завантаження Skills

Окремий CLI `clawhub` також установлює Skills у `./skills` у межах
поточного робочого каталогу. Якщо налаштовано робочий простір OpenClaw,
`clawhub` повертається до цього робочого простору, якщо ви не перевизначите `--workdir`
(або `CLAWHUB_WORKDIR`). OpenClaw завантажує Skills робочого простору з
`<workspace>/skills` і підхоплює їх у **наступній** сесії.

Якщо ви вже використовуєте `~/.openclaw/skills` або вбудовані Skills,
Skills робочого простору мають пріоритет. Докладніше про те, як завантажуються,
спільно використовуються й обмежуються Skills, див. у [Skills](/uk/tools/skills).

## Можливості сервісу

| Можливість        | Примітки                                                    |
| ----------------- | ----------------------------------------------------------- |
| Публічний перегляд | Skills та їхній вміст `SKILL.md` доступні для публічного перегляду. |
| Пошук             | На основі embeddings (векторний пошук), а не лише ключових слів. |
| Версіонування     | Semver, changelog-и й теги (зокрема `latest`).              |
| Завантаження      | Zip для кожної версії.                                      |
| Зірки й коментарі | Відгуки спільноти.                                          |
| Модерація         | Схвалення й перевірки.                                      |
| API, зручний для CLI | Підходить для автоматизації та скриптів.                 |

## Безпека й модерація

ClawHub типово відкритий — будь-хто може завантажувати Skills, але обліковий запис GitHub має бути **не молодшим за один тиждень**, щоб публікувати. Це уповільнює
зловживання, не блокуючи добросовісних учасників.

<AccordionGroup>
  <Accordion title="Скарги">
    - Будь-який користувач, що увійшов у систему, може поскаржитися на Skill.
    - Причини скарги є обов’язковими та зберігаються.
    - Кожен користувач може мати до 20 активних скарг одночасно.
    - Skills із понад 3 унікальними скаргами типово автоматично приховуються.
  </Accordion>
  <Accordion title="Модерація">
    - Модератори можуть переглядати приховані Skills, відкривати їх, видаляти їх або блокувати користувачів.
    - Зловживання функцією скарг може призвести до блокування облікового запису.
    - Хочете стати модератором? Запитайте в Discord OpenClaw і зв’яжіться з модератором або супроводжувачем.
  </Accordion>
</AccordionGroup>

## CLI ClawHub

Він потрібен лише для робочих процесів з автентифікацією в реєстрі, таких як
публікація/синхронізація.

### Глобальні параметри

<ParamField path="--workdir <dir>" type="string">
  Робочий каталог. Типово: поточний каталог; резервно використовується робочий простір OpenClaw.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Каталог Skills, відносно workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  Базовий URL сайту (вхід через браузер).
</ParamField>
<ParamField path="--registry <url>" type="string">
  Базовий URL API реєстру.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Вимкнути запити вводу (неінтерактивний режим).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  Показати версію CLI.
</ParamField>

### Команди

<AccordionGroup>
  <Accordion title="Автентифікація (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Параметри входу:

    - `--token <token>` — вставити API-токен.
    - `--label <label>` — мітка, що зберігається для токенів входу через браузер (типово: `CLI token`).
    - `--no-browser` — не відкривати браузер (потрібен `--token`).

  </Accordion>
  <Accordion title="Пошук">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — максимальна кількість результатів.

  </Accordion>
  <Accordion title="Установлення / оновлення / список">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Параметри:

    - `--version <version>` — установити або оновити до конкретної версії (для одного slug лише в `update`).
    - `--force` — перезаписати, якщо папка вже існує, або коли локальні файли не збігаються з жодною опублікованою версією.
    - `clawhub list` читає `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Публікація Skills">
    ```bash
    clawhub skill publish <path>
    ```

    Параметри:

    - `--slug <slug>` — slug Skill.
    - `--name <name>` — відображувана назва.
    - `--version <version>` — semver-версія.
    - `--changelog <text>` — текст changelog (може бути порожнім).
    - `--tags <tags>` — теги, розділені комами (типово: `latest`).

  </Accordion>
  <Accordion title="Публікація Plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` може бути локальною папкою, `owner/repo`, `owner/repo@ref` або
    URL GitHub.

    Параметри:

    - `--dry-run` — побудувати точний план публікації без завантаження будь-чого.
    - `--json` — виводити машиночитаний результат для CI.
    - `--source-repo`, `--source-commit`, `--source-ref` — необов’язкові перевизначення, коли автовиявлення недостатнє.

  </Accordion>
  <Accordion title="Видалення / відновлення (власник або адміністратор)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Синхронізація (сканування локального + публікація нового або оновленого)">
    ```bash
    clawhub sync
    ```

    Параметри:

    - `--root <dir...>` — додаткові корені сканування.
    - `--all` — завантажити все без запитів.
    - `--dry-run` — показати, що було б завантажено.
    - `--bump <type>` — `patch|minor|major` для оновлень (типово: `patch`).
    - `--changelog <text>` — changelog для неінтерактивних оновлень.
    - `--tags <tags>` — теги, розділені комами (типово: `latest`).
    - `--concurrency <n>` — перевірки реєстру (типово: `4`).

  </Accordion>
</AccordionGroup>

## Типові робочі процеси

<Tabs>
  <Tab title="Пошук">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Установлення">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Оновити все">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Опублікувати один Skill">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Синхронізувати багато Skills">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Опублікувати Plugin з GitHub">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Метадані пакетів Plugin

Кодові Plugin мають містити обов’язкові метадані OpenClaw у
`package.json`:

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

Опубліковані пакети мають постачатися зі **зібраним JavaScript** і вказувати
`runtimeExtensions` на цей результат. Установлення з checkout Git усе ще можуть
резервно використовувати вихідний TypeScript, якщо зібраних файлів немає, але зібрані записи runtime
дозволяють уникнути компіляції TypeScript під час запуску, doctor і
шляхів завантаження Plugin.

## Версіонування, lockfile і телеметрія

<AccordionGroup>
  <Accordion title="Версіонування й теги">
    - Кожна публікація створює нову **semver** `SkillVersion`.
    - Теги (як-от `latest`) вказують на версію; переміщення тегів дає змогу відкотитися.
    - Changelog-и прив’язуються до кожної версії й можуть бути порожніми під час синхронізації або публікації оновлень.
  </Accordion>
  <Accordion title="Локальні зміни проти версій реєстру">
    Оновлення порівнюють локальний вміст Skill із версіями реєстру за допомогою
    хешу вмісту. Якщо локальні файли не збігаються з жодною опублікованою версією,
    CLI запитує підтвердження перед перезаписом (або вимагає `--force` у
    неінтерактивних запусках).
  </Accordion>
  <Accordion title="Сканування sync і резервні корені">
    `clawhub sync` спочатку сканує ваш поточний workdir. Якщо Skills не
    знайдено, він резервно переходить до відомих застарілих розташувань (наприклад
    `~/openclaw/skills` і `~/.openclaw/skills`). Це зроблено для того, щоб
    знаходити старі встановлення Skills без додаткових прапорців.
  </Accordion>
  <Accordion title="Сховище й lockfile">
    - Установлені Skills записуються в `.clawhub/lock.json` у межах вашого workdir.
    - Токени автентифікації зберігаються у файлі конфігурації CLI ClawHub (перевизначається через `CLAWHUB_CONFIG_PATH`).
  </Accordion>
  <Accordion title="Телеметрія (кількість встановлень)">
    Коли ви запускаєте `clawhub sync` у стані входу, CLI надсилає мінімальний
    знімок для обчислення кількості встановлень. Це можна повністю вимкнути:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Змінні середовища

| Змінна                      | Дія                                                  |
| --------------------------- | ---------------------------------------------------- |
| `CLAWHUB_SITE`              | Перевизначає URL сайту.                              |
| `CLAWHUB_REGISTRY`          | Перевизначає URL API реєстру.                        |
| `CLAWHUB_CONFIG_PATH`       | Перевизначає місце, де CLI зберігає токен/конфігурацію. |
| `CLAWHUB_WORKDIR`           | Перевизначає типовий workdir.                        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Вимикає телеметрію для `sync`.                     |

## Пов’язане

- [Plugin спільноти](/uk/plugins/community)
- [Plugins](/uk/tools/plugin)
- [Skills](/uk/tools/skills)
