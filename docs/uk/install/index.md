---
read_when:
    - Вам потрібен спосіб встановлення, відмінний від швидкого старту Getting Started
    - Ви хочете розгорнути на хмарній платформі
    - Потрібно оновити, мігрувати або видалити
summary: Встановлення OpenClaw — скрипт інсталятора, npm/pnpm/bun, із source, Docker тощо
title: Встановлення
x-i18n:
    generated_at: "2026-04-24T03:18:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 48cb531ff09cd9ba076e5a995753c6acd5273f58d9d0f1e51010bf77a18bf85e
    source_path: install/index.md
    workflow: 15
---

## Системні вимоги

- **Node 24** (рекомендовано) або Node 22.14+ — скрипт інсталятора обробляє це автоматично
- **macOS, Linux або Windows** — підтримуються і нативний Windows, і WSL2; WSL2 стабільніший. Див. [Windows](/uk/platforms/windows).
- `pnpm` потрібен лише якщо ви збираєте із source

## Рекомендовано: скрипт інсталятора

Найшвидший спосіб встановлення. Він визначає вашу ОС, за потреби встановлює Node, встановлює OpenClaw і запускає onboarding.

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

Щоб встановити без запуску onboarding:

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

Усі прапорці та параметри для CI/автоматизації див. в [Внутрішня будова інсталятора](/uk/install/installer).

## Альтернативні способи встановлення

### Інсталятор локального префікса (`install-cli.sh`)

Використовуйте цей варіант, якщо ви хочете, щоб OpenClaw і Node зберігалися під локальним префіксом, наприклад
`~/.openclaw`, без залежності від системного встановлення Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Він типово підтримує встановлення через npm, а також встановлення з git checkout у межах того самого
потоку з префіксом. Повний довідник: [Внутрішня будова інсталятора](/uk/install/installer#install-clish).

### npm, pnpm або bun

Якщо ви вже самі керуєте Node:

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm потребує явного підтвердження для пакетів зі скриптами збірки. Після першого встановлення виконайте `pnpm approve-builds -g`.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun підтримується для шляху глобального встановлення CLI. Для середовища виконання Gateway рекомендованим середовищем виконання daemon залишається Node.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Усунення несправностей: помилки збірки sharp (npm)">
  Якщо `sharp` завершується помилкою через глобально встановлений libvips:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Із source

Для контриб’юторів або тих, хто хоче запускати з локального checkout:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Або пропустіть link і використовуйте `pnpm openclaw ...` всередині репозиторію. Повні робочі процеси розробки див. у [Setup](/uk/start/setup).

### Встановлення з GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Контейнери та менеджери пакетів

<CardGroup cols={2}>
  <Card title="Docker" href="/uk/install/docker" icon="container">
    Контейнеризовані або headless-розгортання.
  </Card>
  <Card title="Podman" href="/uk/install/podman" icon="container">
    Rootless-альтернатива Docker для контейнерів.
  </Card>
  <Card title="Nix" href="/uk/install/nix" icon="snowflake">
    Декларативне встановлення через flake Nix.
  </Card>
  <Card title="Ansible" href="/uk/install/ansible" icon="server">
    Автоматизоване розгортання парку систем.
  </Card>
  <Card title="Bun" href="/uk/install/bun" icon="zap">
    Використання лише CLI через середовище виконання Bun.
  </Card>
</CardGroup>

## Перевірка встановлення

```bash
openclaw --version      # підтвердити, що CLI доступний
openclaw doctor         # перевірити проблеми конфігурації
openclaw gateway status # перевірити, що Gateway запущений
```

Якщо після встановлення вам потрібен керований автозапуск:

- macOS: LaunchAgent через `openclaw onboard --install-daemon` або `openclaw gateway install`
- Linux/WSL2: користувацька служба systemd через ті самі команди
- Нативний Windows: насамперед Scheduled Task, із резервним елементом входу в папці Startup для кожного користувача, якщо створення завдання заборонено

## Хостинг і розгортання

Розгорніть OpenClaw на хмарному сервері або VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/uk/vps">Будь-який Linux VPS</Card>
  <Card title="Docker VM" href="/uk/install/docker-vm-runtime">Спільні кроки Docker</Card>
  <Card title="Kubernetes" href="/uk/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/uk/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/uk/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/uk/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/uk/install/azure">Azure</Card>
  <Card title="Railway" href="/uk/install/railway">Railway</Card>
  <Card title="Render" href="/uk/install/render">Render</Card>
  <Card title="Northflank" href="/uk/install/northflank">Northflank</Card>
</CardGroup>

## Оновлення, міграція або видалення

<CardGroup cols={3}>
  <Card title="Updating" href="/uk/install/updating" icon="refresh-cw">
    Підтримуйте OpenClaw в актуальному стані.
  </Card>
  <Card title="Migrating" href="/uk/install/migrating" icon="arrow-right">
    Перенесення на нову машину.
  </Card>
  <Card title="Uninstall" href="/uk/install/uninstall" icon="trash-2">
    Повністю видалити OpenClaw.
  </Card>
</CardGroup>

## Усунення несправностей: `openclaw` не знайдено

Якщо встановлення виконалося успішно, але `openclaw` не знаходиться у вашому терміналі:

```bash
node -v           # Node встановлено?
npm prefix -g     # Де розташовані глобальні пакети?
echo "$PATH"      # Чи є глобальний каталог bin у PATH?
```

Якщо `$(npm prefix -g)/bin` немає у вашому `$PATH`, додайте його до файла запуску вашої оболонки (`~/.zshrc` або `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Потім відкрийте новий термінал. Докладніше див. у [Налаштування Node](/uk/install/node).
