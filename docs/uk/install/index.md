---
read_when:
    - Вам потрібен спосіб встановлення, відмінний від швидкого старту Getting Started
    - Ви хочете розгорнути на хмарній платформі
    - Вам потрібно оновити, перенести або видалити
summary: Встановлення OpenClaw — скрипт встановлення, npm/pnpm/bun, зі source, Docker та інше
title: Встановлення
x-i18n:
    generated_at: "2026-04-05T18:07:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: eca17c76a2a66166b3d8cda9dc3144ab920d30ad0ed2a220eb9389d7a383ba5d
    source_path: install/index.md
    workflow: 15
---

# Встановлення

## Рекомендовано: скрипт встановлення

Найшвидший спосіб встановлення. Він визначає вашу ОС, встановлює Node за потреби, встановлює OpenClaw і запускає onboarding.

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

Усі прапорці та параметри для CI/automation див. у [Внутрішня будова інсталятора](/install/installer).

## Системні вимоги

- **Node 24** (рекомендовано) або Node 22.14+ — скрипт встановлення обробляє це автоматично
- **macOS, Linux або Windows** — підтримуються як нативний Windows, так і WSL2; WSL2 стабільніший. Див. [Windows](/platforms/windows).
- `pnpm` потрібен лише якщо ви збираєте зі source

## Альтернативні способи встановлення

### Інсталятор з локальним префіксом (`install-cli.sh`)

Використовуйте це, якщо хочете зберігати OpenClaw і Node під локальним префіксом, таким як
`~/.openclaw`, не покладаючись на загальносистемне встановлення Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

Типово він підтримує встановлення через npm, а також встановлення з git checkout у межах того самого
процесу з локальним префіксом. Повний довідник: [Внутрішня будова інсталятора](/install/installer#install-clish).

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
    pnpm вимагає явного схвалення для пакетів зі скриптами збирання. Після першого встановлення виконайте `pnpm approve-builds -g`.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun підтримується для глобального шляху встановлення CLI. Для runtime Gateway Node як і раніше залишається рекомендованим runtime для daemon.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Troubleshooting: sharp build errors (npm)">
  Якщо `sharp` завершується помилкою через глобально встановлений libvips:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### Зі source

Для контриб’юторів або всіх, хто хоче запускати з локального checkout:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

Або пропустіть link і використовуйте `pnpm openclaw ...` зсередини репозиторію. Повні dev-процеси див. у [Налаштування](/start/setup).

### Встановлення з GitHub main

```bash
npm install -g github:openclaw/openclaw#main
```

### Контейнери та менеджери пакетів

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    Контейнеризовані або headless-розгортання.
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Rootless-контейнерна альтернатива Docker.
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    Декларативне встановлення через Nix flake.
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    Автоматизоване підготовлення інфраструктури.
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    Використання лише CLI через runtime Bun.
  </Card>
</CardGroup>

## Перевірка встановлення

```bash
openclaw --version      # confirm the CLI is available
openclaw doctor         # check for config issues
openclaw gateway status # verify the Gateway is running
```

Якщо ви хочете керований запуск після встановлення:

- macOS: LaunchAgent через `openclaw onboard --install-daemon` або `openclaw gateway install`
- Linux/WSL2: systemd user service через ті самі команди
- Нативний Windows: спочатку Scheduled Task, із резервним варіантом per-user login item у теці Startup, якщо створення завдання відхилено

## Хостинг і розгортання

Розгорніть OpenClaw на хмарному сервері або VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/vps">Будь-який Linux VPS</Card>
  <Card title="Docker VM" href="/install/docker-vm-runtime">Спільні кроки для Docker</Card>
  <Card title="Kubernetes" href="/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/install/azure">Azure</Card>
  <Card title="Railway" href="/install/railway">Railway</Card>
  <Card title="Render" href="/install/render">Render</Card>
  <Card title="Northflank" href="/install/northflank">Northflank</Card>
</CardGroup>

## Оновлення, перенесення або видалення

<CardGroup cols={3}>
  <Card title="Updating" href="/install/updating" icon="refresh-cw">
    Підтримуйте OpenClaw в актуальному стані.
  </Card>
  <Card title="Migrating" href="/install/migrating" icon="arrow-right">
    Перенесіть на нову машину.
  </Card>
  <Card title="Uninstall" href="/install/uninstall" icon="trash-2">
    Повністю видаліть OpenClaw.
  </Card>
</CardGroup>

## Усунення несправностей: `openclaw` не знайдено

Якщо встановлення пройшло успішно, але `openclaw` не знаходиться у вашому терміналі:

```bash
node -v           # Node installed?
npm prefix -g     # Where are global packages?
echo "$PATH"      # Is the global bin dir in PATH?
```

Якщо `$(npm prefix -g)/bin` немає у вашому `$PATH`, додайте його до файлу запуску shell (`~/.zshrc` або `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Потім відкрийте новий термінал. Докладніше див. у [Налаштування Node](/install/node).
