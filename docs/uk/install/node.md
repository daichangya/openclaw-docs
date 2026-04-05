---
read_when:
    - Вам потрібно встановити Node.js перед встановленням OpenClaw
    - Ви встановили OpenClaw, але `openclaw` повертає command not found
    - '`npm install -g` завершується помилкою через права доступу або проблеми з PATH'
summary: Установлення та налаштування Node.js для OpenClaw — вимоги до версії, способи встановлення та усунення проблем із PATH
title: Node.js
x-i18n:
    generated_at: "2026-04-05T18:08:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e880f6132359dba8720638669df2d71cf857d516cbf5df2589ffeed269b5120
    source_path: install/node.md
    workflow: 15
---

# Node.js

OpenClaw потребує **Node 22.14 або новішої версії**. **Node 24 — типовий і рекомендований runtime** для встановлень, CI та релізних процесів. Node 22 усе ще підтримується в межах активної гілки LTS. [Скрипт встановлення](/install#alternative-install-methods) автоматично визначає та встановлює Node — ця сторінка потрібна для випадків, коли ви хочете налаштувати Node самостійно й переконатися, що все правильно підключено (версії, PATH, глобальні встановлення).

## Перевірте свою версію

```bash
node -v
```

Якщо команда виводить `v24.x.x` або вище, у вас рекомендований типовий варіант. Якщо вона виводить `v22.14.x` або вище, у вас підтримуваний шлях Node 22 LTS, але ми все одно рекомендуємо перейти на Node 24, коли буде зручно. Якщо Node не встановлено або версія надто стара, виберіть один зі способів встановлення нижче.

## Встановлення Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (рекомендовано):

    ```bash
    brew install node
    ```

    Або завантажте інсталятор для macOS із [nodejs.org](https://nodejs.org/).

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    Або використовуйте менеджер версій (див. нижче).

  </Tab>
  <Tab title="Windows">
    **winget** (рекомендовано):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    Або завантажте інсталятор для Windows із [nodejs.org](https://nodejs.org/).

  </Tab>
</Tabs>

<Accordion title="Використання менеджера версій (nvm, fnm, mise, asdf)">
  Менеджери версій дозволяють легко перемикатися між версіями Node. Популярні варіанти:

- [**fnm**](https://github.com/Schniz/fnm) — швидкий, кросплатформний
- [**nvm**](https://github.com/nvm-sh/nvm) — широко використовується на macOS/Linux
- [**mise**](https://mise.jdx.dev/) — для кількох мов одразу (Node, Python, Ruby тощо)

Приклад із fnm:

```bash
fnm install 24
fnm use 24
```

  <Warning>
  Переконайтеся, що ваш менеджер версій ініціалізується у файлі запуску shell (`~/.zshrc` або `~/.bashrc`). Інакше `openclaw` може не знаходитися в нових сесіях термінала, оскільки PATH не міститиме bin-каталог Node.
  </Warning>
</Accordion>

## Усунення несправностей

### `openclaw: command not found`

Майже завжди це означає, що глобальний bin-каталог npm відсутній у вашому PATH.

<Steps>
  <Step title="Знайдіть глобальний npm prefix">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="Перевірте, чи є він у PATH">
    ```bash
    echo "$PATH"
    ```

    Шукайте `<npm-prefix>/bin` (macOS/Linux) або `<npm-prefix>` (Windows) у виводі.

  </Step>
  <Step title="Додайте його до файлу запуску shell">
    <Tabs>
      <Tab title="macOS / Linux">
        Додайте до `~/.zshrc` або `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        Потім відкрийте новий термінал (або виконайте `rehash` у zsh / `hash -r` у bash).
      </Tab>
      <Tab title="Windows">
        Додайте вивід `npm prefix -g` до системного PATH через Settings → System → Environment Variables.
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Помилки прав доступу під час `npm install -g` (Linux)

Якщо ви бачите помилки `EACCES`, змініть глобальний prefix npm на каталог, доступний для запису користувачем:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

Додайте рядок `export PATH=...` до `~/.bashrc` або `~/.zshrc`, щоб зробити зміну постійною.

## Пов’язане

- [Огляд встановлення](/install) — усі способи встановлення
- [Оновлення](/install/updating) — підтримка OpenClaw в актуальному стані
- [Початок роботи](/start/getting-started) — перші кроки після встановлення
