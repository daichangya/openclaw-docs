---
read_when:
    - Ви хочете зрозуміти `openclaw.ai/install.sh`
    - Ви хочете автоматизувати встановлення (CI / headless)
    - Ви хочете встановити з checkout GitHub
summary: Як працюють скрипти встановлення (`install.sh`, `install-cli.sh`, `install.ps1`), прапорці та автоматизація
title: Внутрішня будова інсталятора
x-i18n:
    generated_at: "2026-04-24T03:19:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc54080bb93ffab3dc7827f568a0a44cda89c6d3c5f9d485c6dde7ca42837807
    source_path: install/installer.md
    workflow: 15
---

OpenClaw постачається з трьома скриптами встановлення, які роздаються з `openclaw.ai`.

| Скрипт                            | Платформа            | Що він робить                                                                                                    |
| --------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)        | macOS / Linux / WSL  | Встановлює Node за потреби, встановлює OpenClaw через npm (типово) або git і може запустити онбординг.         |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Встановлює Node + OpenClaw у локальний префікс (`~/.openclaw`) у режимах npm або git checkout. Root не потрібен. |
| [`install.ps1`](#installps1)      | Windows (PowerShell) | Встановлює Node за потреби, встановлює OpenClaw через npm (типово) або git і може запустити онбординг.         |

## Швидкі команди

<Tabs>
  <Tab title="install.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install-cli.sh">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```

    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --help
    ```

  </Tab>
  <Tab title="install.ps1">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```

    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag beta -NoOnboard -DryRun
    ```

  </Tab>
</Tabs>

<Note>
Якщо встановлення пройшло успішно, але `openclaw` не знаходиться в новому терміналі, див. [усунення несправностей Node.js](/uk/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Рекомендовано для більшості інтерактивних встановлень на macOS/Linux/WSL.
</Tip>

### Потік (install.sh)

<Steps>
  <Step title="Визначення ОС">
    Підтримуються macOS і Linux (включно з WSL). Якщо виявлено macOS, Homebrew буде встановлено, якщо його немає.
  </Step>
  <Step title="Забезпечення Node.js 24 типово">
    Перевіряє версію Node і встановлює Node 24 за потреби (Homebrew на macOS, скрипти налаштування NodeSource для apt/dnf/yum на Linux). OpenClaw і далі підтримує Node 22 LTS, наразі `22.14+`, для сумісності.
  </Step>
  <Step title="Забезпечення Git">
    Встановлює Git, якщо його немає.
  </Step>
  <Step title="Встановлення OpenClaw">
    - метод `npm` (типово): глобальне встановлення npm
    - метод `git`: клонування/оновлення репозиторію, встановлення залежностей через pnpm, збірка, а потім встановлення wrapper у `~/.local/bin/openclaw`
  </Step>
  <Step title="Завдання після встановлення">
    - Оновлює завантажений сервіс gateway у режимі best-effort (`openclaw gateway install --force`, потім restart)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і git-встановлень (best effort)
    - Намагається виконати онбординг, коли це доречно (доступний TTY, онбординг не вимкнено, а перевірки bootstrap/config пройдено)
    - Типово встановлює `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### Виявлення source checkout

Якщо скрипт запускається всередині checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), він пропонує:

- використати checkout (`git`), або
- використати глобальне встановлення (`npm`)

Якщо TTY недоступний і метод встановлення не задано, типово використовується `npm` з попередженням.

Скрипт завершується з кодом `2` для невалідного вибору методу або невалідних значень `--install-method`.

### Приклади (install.sh)

<Tabs>
  <Tab title="Типово">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Пропустити онбординг">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Git-встановлення">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
    ```
  </Tab>
  <Tab title="GitHub main через npm">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --version main
    ```
  </Tab>
  <Tab title="Сухий запуск">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --dry-run
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Прапорець                             | Опис                                                         |
| ------------------------------------- | ------------------------------------------------------------ |
| `--install-method npm\|git`           | Вибір методу встановлення (типово: `npm`). Псевдонім: `--method` |
| `--npm`                               | Скорочення для методу npm                                    |
| `--git`                               | Скорочення для методу git. Псевдонім: `--github`             |
| `--version <version\|dist-tag\|spec>` | Версія npm, dist-tag або package spec (типово: `latest`)     |
| `--beta`                              | Використовувати beta dist-tag, якщо доступний, інакше fallback до `latest` |
| `--git-dir <path>`                    | Каталог checkout (типово: `~/openclaw`). Псевдонім: `--dir`  |
| `--no-git-update`                     | Пропустити `git pull` для наявного checkout                  |
| `--no-prompt`                         | Вимкнути запити                                              |
| `--no-onboard`                        | Пропустити онбординг                                         |
| `--onboard`                           | Увімкнути онбординг                                          |
| `--dry-run`                           | Показати дії без застосування змін                           |
| `--verbose`                           | Увімкнути debug-вивід (`set -x`, логи npm рівня notice)      |
| `--help`                              | Показати usage (`-h`)                                        |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                                                 | Опис                                                |
| ------------------------------------------------------ | --------------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                     | Метод встановлення                                  |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Версія npm, dist-tag або package spec               |
| `OPENCLAW_BETA=0\|1`                                   | Використовувати beta, якщо доступна                 |
| `OPENCLAW_GIT_DIR=<path>`                              | Каталог checkout                                    |
| `OPENCLAW_GIT_UPDATE=0\|1`                             | Перемикач оновлень git                              |
| `OPENCLAW_NO_PROMPT=1`                                 | Вимкнути запити                                     |
| `OPENCLAW_NO_ONBOARD=1`                                | Пропустити онбординг                                |
| `OPENCLAW_DRY_RUN=1`                                   | Режим сухого запуску                                |
| `OPENCLAW_VERBOSE=1`                                   | Режим debug                                         |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`            | Рівень логування npm                                |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                     | Керування поведінкою sharp/libvips (типово: `1`)    |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Призначено для середовищ, де ви хочете мати все під локальним префіксом
(типово `~/.openclaw`) і без системної залежності від Node. Типово підтримує npm-встановлення,
а також встановлення з git-checkout у тому самому потоці через префікс.
</Info>

### Потік (install-cli.sh)

<Steps>
  <Step title="Встановлення локального runtime Node">
    Завантажує зафіксований підтримуваний tarball Node LTS (версія вбудована в скрипт і оновлюється незалежно) до `<prefix>/tools/node-v<version>` і перевіряє SHA-256.
  </Step>
  <Step title="Забезпечення Git">
    Якщо Git відсутній, намагається встановити його через apt/dnf/yum на Linux або Homebrew на macOS.
  </Step>
  <Step title="Встановлення OpenClaw під префіксом">
    - метод `npm` (типово): встановлює під префіксом через npm, а потім записує wrapper у `<prefix>/bin/openclaw`
    - метод `git`: клонує/оновлює checkout (типово `~/openclaw`) і все одно записує wrapper у `<prefix>/bin/openclaw`
  </Step>
  <Step title="Оновлення завантаженого сервісу gateway">
    Якщо сервіс gateway уже завантажено з того самого префікса, скрипт виконує
    `openclaw gateway install --force`, потім `openclaw gateway restart`, і
    у режимі best-effort перевіряє стан gateway.
  </Step>
</Steps>

### Приклади (install-cli.sh)

<Tabs>
  <Tab title="Типово">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Власний префікс + версія">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Git-встановлення">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --install-method git --git-dir ~/openclaw
    ```
  </Tab>
  <Tab title="JSON-вивід для автоматизації">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="Запустити онбординг">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --onboard
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Прапорець                | Опис                                                                            |
| ------------------------ | ------------------------------------------------------------------------------- |
| `--prefix <path>`        | Префікс встановлення (типово: `~/.openclaw`)                                    |
| `--install-method npm\|git` | Вибір методу встановлення (типово: `npm`). Псевдонім: `--method`            |
| `--npm`                  | Скорочення для методу npm                                                       |
| `--git`, `--github`      | Скорочення для методу git                                                       |
| `--git-dir <path>`       | Каталог git checkout (типово: `~/openclaw`). Псевдонім: `--dir`                 |
| `--version <ver>`        | Версія OpenClaw або dist-tag (типово: `latest`)                                 |
| `--node-version <ver>`   | Версія Node (типово: `22.22.0`)                                                 |
| `--json`                 | Виводити події NDJSON                                                           |
| `--onboard`              | Запустити `openclaw onboard` після встановлення                                 |
| `--no-onboard`           | Пропустити онбординг (типово)                                                   |
| `--set-npm-prefix`       | На Linux примусово встановити npm prefix у `~/.npm-global`, якщо поточний prefix недоступний для запису |
| `--help`                 | Показати usage (`-h`)                                                           |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                                     | Опис                                                |
| ------------------------------------------ | --------------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                   | Префікс встановлення                                |
| `OPENCLAW_INSTALL_METHOD=git\|npm`         | Метод встановлення                                  |
| `OPENCLAW_VERSION=<ver>`                   | Версія OpenClaw або dist-tag                        |
| `OPENCLAW_NODE_VERSION=<ver>`              | Версія Node                                         |
| `OPENCLAW_GIT_DIR=<path>`                  | Каталог git checkout для git-встановлень            |
| `OPENCLAW_GIT_UPDATE=0\|1`                 | Перемикач git-оновлень для наявних checkout         |
| `OPENCLAW_NO_ONBOARD=1`                    | Пропустити онбординг                                |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Рівень логування npm                               |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`         | Керування поведінкою sharp/libvips (типово: `1`)    |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Потік (install.ps1)

<Steps>
  <Step title="Забезпечення PowerShell + середовища Windows">
    Потрібен PowerShell 5+.
  </Step>
  <Step title="Забезпечення Node.js 24 типово">
    Якщо Node відсутній, скрипт намагається встановити його через winget, потім Chocolatey, потім Scoop. Node 22 LTS, наразі `22.14+`, і далі підтримується для сумісності.
  </Step>
  <Step title="Встановлення OpenClaw">
    - метод `npm` (типово): глобальне встановлення npm з використанням вибраного `-Tag`
    - метод `git`: клонування/оновлення репозиторію, встановлення/збірка через pnpm і встановлення wrapper у `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="Завдання після встановлення">
    - Додає потрібний каталог bin до PATH користувача, якщо це можливо
    - Оновлює завантажений сервіс gateway у режимі best-effort (`openclaw gateway install --force`, потім restart)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і git-встановлень (best effort)
  </Step>
</Steps>

### Приклади (install.ps1)

<Tabs>
  <Tab title="Типово">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
  <Tab title="Git-встановлення">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git
    ```
  </Tab>
  <Tab title="GitHub main через npm">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -Tag main
    ```
  </Tab>
  <Tab title="Власний каталог git">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -InstallMethod git -GitDir "C:\openclaw"
    ```
  </Tab>
  <Tab title="Сухий запуск">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -DryRun
    ```
  </Tab>
  <Tab title="Debug trace">
    ```powershell
    # install.ps1 поки що не має окремого прапорця -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорців">

| Прапорець                  | Опис                                                         |
| -------------------------- | ------------------------------------------------------------ |
| `-InstallMethod npm\|git`  | Метод встановлення (типово: `npm`)                           |
| `-Tag <tag\|version\|spec>` | npm dist-tag, версія або package spec (типово: `latest`)    |
| `-GitDir <path>`           | Каталог checkout (типово: `%USERPROFILE%\openclaw`)          |
| `-NoOnboard`               | Пропустити онбординг                                         |
| `-NoGitUpdate`             | Пропустити `git pull`                                        |
| `-DryRun`                  | Лише показати дії                                            |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                            | Опис                |
| --------------------------------- | ------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Метод встановлення |
| `OPENCLAW_GIT_DIR=<path>`         | Каталог checkout    |
| `OPENCLAW_NO_ONBOARD=1`           | Пропустити онбординг |
| `OPENCLAW_GIT_UPDATE=0`           | Вимкнути git pull   |
| `OPENCLAW_DRY_RUN=1`              | Режим сухого запуску |

  </Accordion>
</AccordionGroup>

<Note>
Якщо використовується `-InstallMethod git` і Git відсутній, скрипт завершується та виводить посилання на Git for Windows.
</Note>

---

## CI та автоматизація

Використовуйте неінтерактивні прапорці/env vars для передбачуваних запусків.

<Tabs>
  <Tab title="install.sh (неінтерактивний npm)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-prompt --no-onboard
    ```
  </Tab>
  <Tab title="install.sh (неінтерактивний git)">
    ```bash
    OPENCLAW_INSTALL_METHOD=git OPENCLAW_NO_PROMPT=1 \
      curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="install-cli.sh (JSON)">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --json --prefix /opt/openclaw
    ```
  </Tab>
  <Tab title="install.ps1 (пропустити онбординг)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

---

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Чому потрібен Git?">
    Git потрібен для методу встановлення `git`. Для встановлень через `npm` Git усе одно перевіряється/встановлюється, щоб уникнути збоїв `spawn git ENOENT`, коли залежності використовують git URL.
  </Accordion>

  <Accordion title="Чому npm отримує EACCES на Linux?">
    У деяких конфігураціях Linux глобальний prefix npm вказує на шляхи, що належать root. `install.sh` може перемкнути prefix на `~/.npm-global` і дописати експорти PATH у shell rc-файли (коли ці файли існують).
  </Accordion>

  <Accordion title="Проблеми sharp/libvips">
    Скрипти типово встановлюють `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, щоб уникнути збірки sharp проти системного libvips. Щоб перевизначити це:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Встановіть Git for Windows, знову відкрийте PowerShell і повторно запустіть інсталятор.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Виконайте `npm config get prefix` і додайте цей каталог до вашого PATH користувача (суфікс `\bin` у Windows не потрібен), а потім знову відкрийте PowerShell.
  </Accordion>

  <Accordion title="Windows: як отримати докладний вивід інсталятора">
    `install.ps1` наразі не має прапорця `-Verbose`.
    Використовуйте трасування PowerShell для діагностики на рівні скрипта:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw не знайдено після встановлення">
    Зазвичай це проблема PATH. Див. [усунення несправностей Node.js](/uk/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>

## Пов’язане

- [Огляд встановлення](/uk/install)
- [Оновлення](/uk/install/updating)
- [Видалення](/uk/install/uninstall)
