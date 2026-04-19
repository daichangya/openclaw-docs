---
read_when:
    - Вам потрібен спосіб встановлення, відмінний від короткого посібника Getting Started
    - Ви хочете розгорнути на хмарній платформі
    - Вам потрібно оновити, перенести або видалити
summary: Встановити OpenClaw — скрипт встановлення, npm/pnpm/bun, зі source, Docker та інше
title: Встановити
x-i18n:
    generated_at: "2026-04-19T06:50:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0a5fdbbf13dcaf2fed6840f35aa22b2e9e458509509f98303c8d87c2556a6f
    source_path: install/index.md
    workflow: 15
---

# Встановлення

## Рекомендовано: скрипт встановлення

Найшвидший спосіб встановлення. Він визначає вашу ОС, за потреби встановлює Node, встановлює OpenClaw і запускає онбординг.

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

Щоб встановити без запуску онбордингу:

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

Усі прапорці та параметри для CI/автоматизації дивіться в [Внутрішні механізми інсталятора](/uk/install/installer).

## Системні вимоги

- **Node 24** (рекомендовано) або Node 22.14+ — скрипт встановлення обробляє це автоматично
- **macOS, Linux або Windows** — підтримуються як нативний Windows, так і WSL2; WSL2 стабільніший. Див. [Windows](/uk/platforms/windows).
- `pnpm` потрібен лише якщо ви збираєте зі source

## Альтернативні способи встановлення

### Інсталятор із локальним префіксом (`install-cli.sh`)

Використовуйте це, якщо хочете, щоб OpenClaw і Node зберігалися в локальному префіксі, наприклад
`~/.openclaw`, без залежності від системного встановлення Node:

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

За замовчуванням він підтримує встановлення через npm, а також встановлення з git checkout у межах того самого
потоку з префіксом. Повний довідник: [Внутрішні механізми інсталятора](/uk/install/installer#install-clish).

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
    pnpm вимагає явного схвалення для пакетів зі скриптами збірки. Після першого встановлення виконайте `pnpm approve-builds -g`.
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun підтримується для шляху глобального встановлення CLI. Для середовища виконання Gateway рекомендованим середовищем виконання демона залишається Node.
    </Note>

  </Tab>
</Tabs>

<Accordion title="Усунення проблем: помилки збірки sharp (npm)">
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
pnpm install && pnpm build && pnpm ui:build
pnpm link --global
openclaw onboard --install-daemon
```

Або пропустіть link і використовуйте `pnpm openclaw ...` всередині репозиторію. Повні робочі процеси розробки дивіться в [Налаштування](/uk/start/setup).

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
    Rootless-альтернатива Docker.
  </Card>
  <Card title="Nix" href="/uk/install/nix" icon="snowflake">
    Декларативне встановлення через Nix flake.
  </Card>
  <Card title="Ansible" href="/uk/install/ansible" icon="server">
    Автоматизоване підготовлення парку систем.
  </Card>
  <Card title="Bun" href="/uk/install/bun" icon="zap">
    Використання лише CLI через середовище виконання Bun.
  </Card>
</CardGroup>

## Перевірка встановлення

```bash
openclaw --version      # підтвердити, що CLI доступний
openclaw doctor         # перевірити проблеми конфігурації
openclaw gateway status # перевірити, що Gateway запущено
```

Якщо після встановлення ви хочете керований запуск:

- macOS: LaunchAgent через `openclaw onboard --install-daemon` або `openclaw gateway install`
- Linux/WSL2: користувацька служба systemd через ті самі команди
- Нативний Windows: спочатку Scheduled Task, із резервним варіантом елемента входу в систему в папці Startup для конкретного користувача, якщо створення завдання заборонено

## Хостинг і розгортання

Розгорніть OpenClaw на хмарному сервері або VPS:

<CardGroup cols={3}>
  <Card title="VPS" href="/uk/vps">Будь-який Linux VPS</Card>
  <Card title="Docker VM" href="/uk/install/docker-vm-runtime">Спільні кроки для Docker</Card>
  <Card title="Kubernetes" href="/uk/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/uk/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/uk/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/uk/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/uk/install/azure">Azure</Card>
  <Card title="Railway" href="/uk/install/railway">Railway</Card>
  <Card title="Render" href="/uk/install/render">Render</Card>
  <Card title="Northflank" href="/uk/install/northflank">Northflank</Card>
</CardGroup>

## Оновлення, перенесення або видалення

<CardGroup cols={3}>
  <Card title="Оновлення" href="/uk/install/updating" icon="refresh-cw">
    Підтримуйте OpenClaw в актуальному стані.
  </Card>
  <Card title="Перенесення" href="/uk/install/migrating" icon="arrow-right">
    Перехід на нову машину.
  </Card>
  <Card title="Видалення" href="/uk/install/uninstall" icon="trash-2">
    Повністю видалити OpenClaw.
  </Card>
</CardGroup>

## Усунення проблем: `openclaw` не знайдено

Якщо встановлення виконалося успішно, але `openclaw` не знаходиться у вашому терміналі:

```bash
node -v           # Node встановлено?
npm prefix -g     # Де розташовані глобальні пакети?
echo "$PATH"      # Чи є глобальний каталог bin у PATH?
```

Якщо `$(npm prefix -g)/bin` відсутній у вашому `$PATH`, додайте його до файлу запуску оболонки (`~/.zshrc` або `~/.bashrc`):

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

Потім відкрийте новий термінал. Докладніше дивіться в [Налаштування Node](/uk/install/node).
