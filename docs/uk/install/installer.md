---
read_when:
    - Ви хочете зрозуміти `openclaw.ai/install.sh`
    - Ви хочете автоматизувати встановлення (CI / headless)
    - Ви хочете встановити з GitHub checkout
summary: Як працюють скрипти встановлення (`install.sh`, `install-cli.sh`, `install.ps1`), їхні прапори та автоматизація
title: Внутрішня будова інсталяторів
x-i18n:
    generated_at: "2026-04-05T18:08:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: eced891572b8825b1f8a26ccc9d105ae8a38bd8ad89baef2f1927e27d4619e04
    source_path: install/installer.md
    workflow: 15
---

# Внутрішня будова інсталяторів

OpenClaw постачається з трьома скриптами встановлення, які віддаються з `openclaw.ai`.

| Скрипт                             | Платформа            | Що він робить                                                                                                   |
| ---------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------- |
| [`install.sh`](#installsh)         | macOS / Linux / WSL  | Установлює Node за потреби, установлює OpenClaw через npm (типово) або git і може запустити онбординг.        |
| [`install-cli.sh`](#install-clish) | macOS / Linux / WSL  | Установлює Node + OpenClaw у локальний prefix (`~/.openclaw`) у режимі npm або git checkout. Root не потрібен. |
| [`install.ps1`](#installps1)       | Windows (PowerShell) | Установлює Node за потреби, установлює OpenClaw через npm (типово) або git і може запустити онбординг.        |

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
Якщо встановлення пройшло успішно, але `openclaw` не знаходиться в новому терміналі, див. [усунення проблем із Node.js](/install/node#troubleshooting).
</Note>

---

<a id="installsh"></a>

## install.sh

<Tip>
Рекомендовано для більшості інтерактивних встановлень на macOS/Linux/WSL.
</Tip>

### Потік виконання (install.sh)

<Steps>
  <Step title="Визначення ОС">
    Підтримує macOS і Linux (включно з WSL). Якщо виявлено macOS, установлює Homebrew, якщо його немає.
  </Step>
  <Step title="Типово забезпечує Node.js 24">
    Перевіряє версію Node і за потреби встановлює Node 24 (Homebrew на macOS, скрипти налаштування NodeSource для Linux apt/dnf/yum). OpenClaw і далі підтримує Node 22 LTS, наразі `22.14+`, для сумісності.
  </Step>
  <Step title="Забезпечує Git">
    Установлює Git, якщо його немає.
  </Step>
  <Step title="Установлює OpenClaw">
    - метод `npm` (типово): глобальне встановлення через npm
    - метод `git`: клонування/оновлення репозиторію, встановлення залежностей через pnpm, збірка, а потім установлення обгортки в `~/.local/bin/openclaw`
  </Step>
  <Step title="Завдання після встановлення">
    - Оновлює завантажений сервіс gateway у режимі best-effort (`openclaw gateway install --force`, потім restart)
    - Запускає `openclaw doctor --non-interactive` під час оновлень і git-встановлень (best effort)
    - Намагається запустити онбординг, коли це доречно (TTY доступний, онбординг не вимкнено, перевірки bootstrap/config пройдені)
    - Типово встановлює `SHARP_IGNORE_GLOBAL_LIBVIPS=1`
  </Step>
</Steps>

### Визначення source checkout

Якщо скрипт запущено всередині checkout OpenClaw (`package.json` + `pnpm-workspace.yaml`), він пропонує:

- використати checkout (`git`), або
- використати глобальне встановлення (`npm`)

Якщо TTY недоступний і метод встановлення не задано, за замовчуванням використовується `npm` і виводиться попередження.

Скрипт завершується з кодом `2` у разі некоректного вибору методу або некоректних значень `--install-method`.

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
  <Tab title="Встановлення через git">
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
  <Accordion title="Довідник прапорів">

| Прапор                                | Опис                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `--install-method npm\|git`           | Вибір методу встановлення (типово: `npm`). Псевдонім: `--method`  |
| `--npm`                               | Скорочення для методу npm                                  |
| `--git`                               | Скорочення для методу git. Псевдонім: `--github`           |
| `--version <version\|dist-tag\|spec>` | Версія npm, dist-tag або package spec (типово: `latest`)   |
| `--beta`                              | Використовувати beta dist-tag, якщо доступний, інакше fallback до `latest`  |
| `--git-dir <path>`                    | Каталог checkout (типово: `~/openclaw`). Псевдонім: `--dir` |
| `--no-git-update`                     | Пропустити `git pull` для наявного checkout                |
| `--no-prompt`                         | Вимкнути prompt                                            |
| `--no-onboard`                        | Пропустити онбординг                                       |
| `--onboard`                           | Увімкнути онбординг                                        |
| `--dry-run`                           | Вивести дії без застосування змін                          |
| `--verbose`                           | Увімкнути debug-вивід (`set -x`, журнали npm рівня notice) |
| `--help`                              | Показати usage (`-h`)                                      |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                                                 | Опис                                          |
| ------------------------------------------------------ | --------------------------------------------- |
| `OPENCLAW_INSTALL_METHOD=git\|npm`                     | Метод встановлення                            |
| `OPENCLAW_VERSION=latest\|next\|main\|<semver>\|<spec>` | Версія npm, dist-tag або package spec         |
| `OPENCLAW_BETA=0\|1`                                   | Використовувати beta, якщо доступна           |
| `OPENCLAW_GIT_DIR=<path>`                              | Каталог checkout                              |
| `OPENCLAW_GIT_UPDATE=0\|1`                             | Перемикач оновлень git                        |
| `OPENCLAW_NO_PROMPT=1`                                 | Вимкнути prompt                               |
| `OPENCLAW_NO_ONBOARD=1`                                | Пропустити онбординг                          |
| `OPENCLAW_DRY_RUN=1`                                   | Режим сухого запуску                          |
| `OPENCLAW_VERBOSE=1`                                   | Режим debug                                   |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice`            | Рівень журналювання npm                       |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`                     | Керування поведінкою sharp/libvips (типово: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="install-clish"></a>

## install-cli.sh

<Info>
Призначений для середовищ, де ви хочете тримати все під локальним prefix
(типово `~/.openclaw`) і без системної залежності від Node. Типово підтримує встановлення через npm,
а також встановлення з git-checkout у межах того самого потоку prefix.
</Info>

### Потік виконання (install-cli.sh)

<Steps>
  <Step title="Установлення локального runtime Node">
    Завантажує закріплений tarball підтримуваної Node LTS (версію вбудовано в скрипт і оновлюється незалежно) у `<prefix>/tools/node-v<version>` і перевіряє SHA-256.
  </Step>
  <Step title="Забезпечує Git">
    Якщо Git відсутній, намагається встановити його через apt/dnf/yum у Linux або Homebrew на macOS.
  </Step>
  <Step title="Установлення OpenClaw у prefix">
    - метод `npm` (типово): установлює в prefix через npm, а потім записує обгортку в `<prefix>/bin/openclaw`
    - метод `git`: клонує/оновлює checkout (типово `~/openclaw`) і все одно записує обгортку в `<prefix>/bin/openclaw`
  </Step>
  <Step title="Оновлення завантаженого сервісу gateway">
    Якщо сервіс gateway уже завантажено з цього самого prefix, скрипт виконує
    `openclaw gateway install --force`, потім `openclaw gateway restart` і
    у режимі best-effort перевіряє health gateway.
  </Step>
</Steps>

### Приклади (install-cli.sh)

<Tabs>
  <Tab title="Типово">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash
    ```
  </Tab>
  <Tab title="Власний prefix + версія">
    ```bash
    curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install-cli.sh | bash -s -- --prefix /opt/openclaw --version latest
    ```
  </Tab>
  <Tab title="Встановлення через git">
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
  <Accordion title="Довідник прапорів">

| Прапор                      | Опис                                                                            |
| --------------------------- | ------------------------------------------------------------------------------- |
| `--prefix <path>`           | Prefix встановлення (типово: `~/.openclaw`)                                     |
| `--install-method npm\|git` | Вибір методу встановлення (типово: `npm`). Псевдонім: `--method`                |
| `--npm`                     | Скорочення для методу npm                                                       |
| `--git`, `--github`         | Скорочення для методу git                                                       |
| `--git-dir <path>`          | Каталог git checkout (типово: `~/openclaw`). Псевдонім: `--dir`                 |
| `--version <ver>`           | Версія OpenClaw або dist-tag (типово: `latest`)                                 |
| `--node-version <ver>`      | Версія Node (типово: `22.22.0`)                                                 |
| `--json`                    | Виводити події NDJSON                                                           |
| `--onboard`                 | Запустити `openclaw onboard` після встановлення                                 |
| `--no-onboard`              | Пропустити онбординг (типово)                                                   |
| `--set-npm-prefix`          | У Linux примусово встановити npm prefix у `~/.npm-global`, якщо поточний prefix недоступний для запису |
| `--help`                    | Показати usage (`-h`)                                                           |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                                    | Опис                                          |
| ----------------------------------------- | --------------------------------------------- |
| `OPENCLAW_PREFIX=<path>`                  | Prefix встановлення                           |
| `OPENCLAW_INSTALL_METHOD=git\|npm`        | Метод встановлення                            |
| `OPENCLAW_VERSION=<ver>`                  | Версія OpenClaw або dist-tag                  |
| `OPENCLAW_NODE_VERSION=<ver>`             | Версія Node                                   |
| `OPENCLAW_GIT_DIR=<path>`                 | Каталог git checkout для git-встановлень      |
| `OPENCLAW_GIT_UPDATE=0\|1`                | Перемикач оновлень git для наявних checkout   |
| `OPENCLAW_NO_ONBOARD=1`                   | Пропустити онбординг                          |
| `OPENCLAW_NPM_LOGLEVEL=error\|warn\|notice` | Рівень журналювання npm                     |
| `SHARP_IGNORE_GLOBAL_LIBVIPS=0\|1`        | Керування поведінкою sharp/libvips (типово: `1`) |

  </Accordion>
</AccordionGroup>

---

<a id="installps1"></a>

## install.ps1

### Потік виконання (install.ps1)

<Steps>
  <Step title="Забезпечує PowerShell + середовище Windows">
    Потрібен PowerShell 5+.
  </Step>
  <Step title="Типово забезпечує Node.js 24">
    Якщо відсутній, намагається встановити через winget, потім Chocolatey, потім Scoop. Node 22 LTS, наразі `22.14+`, і далі підтримується для сумісності.
  </Step>
  <Step title="Установлює OpenClaw">
    - метод `npm` (типово): глобальне встановлення через npm із використанням вибраного `-Tag`
    - метод `git`: клонування/оновлення репозиторію, встановлення/збірка через pnpm і встановлення обгортки в `%USERPROFILE%\.local\bin\openclaw.cmd`
  </Step>
  <Step title="Завдання після встановлення">
    - Додає потрібний каталог bin до користувацького PATH, коли це можливо
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
  <Tab title="Встановлення через git">
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
  <Tab title="Трасування debug">
    ```powershell
    # install.ps1 поки що не має окремого прапора -Verbose.
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```
  </Tab>
</Tabs>

<AccordionGroup>
  <Accordion title="Довідник прапорів">

| Прапор                      | Опис                                                       |
| --------------------------- | ---------------------------------------------------------- |
| `-InstallMethod npm\|git`   | Метод встановлення (типово: `npm`)                         |
| `-Tag <tag\|version\|spec>` | npm dist-tag, версія або package spec (типово: `latest`)   |
| `-GitDir <path>`            | Каталог checkout (типово: `%USERPROFILE%\openclaw`)        |
| `-NoOnboard`                | Пропустити онбординг                                       |
| `-NoGitUpdate`              | Пропустити `git pull`                                      |
| `-DryRun`                   | Лише вивести дії                                           |

  </Accordion>

  <Accordion title="Довідник змінних середовища">

| Змінна                           | Опис               |
| -------------------------------- | ------------------ |
| `OPENCLAW_INSTALL_METHOD=git\|npm` | Метод встановлення |
| `OPENCLAW_GIT_DIR=<path>`        | Каталог checkout   |
| `OPENCLAW_NO_ONBOARD=1`          | Пропустити онбординг |
| `OPENCLAW_GIT_UPDATE=0`          | Вимкнути git pull  |
| `OPENCLAW_DRY_RUN=1`             | Режим сухого запуску |

  </Accordion>
</AccordionGroup>

<Note>
Якщо використовується `-InstallMethod git`, а Git відсутній, скрипт завершується і виводить посилання на Git for Windows.
</Note>

---

## CI та автоматизація

Використовуйте неінтерактивні прапори/змінні середовища для передбачуваних запусків.

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

## Усунення проблем

<AccordionGroup>
  <Accordion title="Чому потрібен Git?">
    Git потрібен для методу встановлення `git`. Для встановлень через `npm` Git усе одно перевіряється/встановлюється, щоб уникнути збоїв `spawn git ENOENT`, коли залежності використовують git URL.
  </Accordion>

  <Accordion title="Чому npm отримує EACCES у Linux?">
    У деяких Linux-налаштуваннях глобальний prefix npm вказує на шляхи, що належать root. `install.sh` може переключити prefix на `~/.npm-global` і додати експорти PATH у shell rc-файли (коли ці файли існують).
  </Accordion>

  <Accordion title="Проблеми із sharp/libvips">
    Скрипти типово встановлюють `SHARP_IGNORE_GLOBAL_LIBVIPS=1`, щоб уникнути збирання sharp проти системного libvips. Щоб перевизначити:

    ```bash
    SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash
    ```

  </Accordion>

  <Accordion title='Windows: "npm error spawn git / ENOENT"'>
    Установіть Git for Windows, знову відкрийте PowerShell і повторно запустіть інсталятор.
  </Accordion>

  <Accordion title='Windows: "openclaw is not recognized"'>
    Виконайте `npm config get prefix` і додайте цей каталог до користувацького PATH (у Windows не потрібен суфікс `\bin`), а потім знову відкрийте PowerShell.
  </Accordion>

  <Accordion title="Windows: як отримати докладний вивід інсталятора">
    `install.ps1` наразі не надає перемикача `-Verbose`.
    Для діагностики на рівні скрипту використовуйте трасування PowerShell:

    ```powershell
    Set-PSDebug -Trace 1
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    Set-PSDebug -Trace 0
    ```

  </Accordion>

  <Accordion title="openclaw не знайдено після встановлення">
    Зазвичай це проблема з PATH. Див. [усунення проблем із Node.js](/install/node#troubleshooting).
  </Accordion>
</AccordionGroup>
