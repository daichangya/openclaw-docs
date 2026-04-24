---
read_when:
    - Встановлення OpenClaw на Windows
    - Вибір між native Windows і WSL2
    - Шукаєте статус companion app для Windows
summary: 'Підтримка Windows: власні шляхи встановлення та через WSL2, daemon і поточні застереження'
title: Windows
x-i18n:
    generated_at: "2026-04-24T03:19:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc147a9da97ab911ba7529c2170526c50c86711efe6fdf4854e6e0370e4d64ea
    source_path: platforms/windows.md
    workflow: 15
---

OpenClaw підтримує і **native Windows**, і **WSL2**. WSL2 — стабільніший
шлях і рекомендований для повного досвіду використання: CLI, Gateway і
інструменти працюють усередині Linux з повною сумісністю. Native Windows
працює для базового використання CLI і Gateway, з деякими застереженнями,
наведеними нижче.

Native companion app для Windows заплановані.

## WSL2 (рекомендовано)

- [Початок роботи](/uk/start/getting-started) (використовуйте всередині WSL)
- [Встановлення й оновлення](/uk/install/updating)
- Офіційний посібник WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Статус native Windows

Потоки native Windows CLI покращуються, але WSL2 все ще є рекомендованим шляхом.

Що сьогодні добре працює на native Windows:

- інсталятор із сайта через `install.ps1`
- локальне використання CLI, наприклад `openclaw --version`, `openclaw doctor` і `openclaw plugins list --json`
- вбудована локальна smoke-перевірка agent/provider, наприклад:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Поточні застереження:

- `openclaw onboard --non-interactive` усе ще очікує доступний локальний gateway, якщо ви не передасте `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` і `openclaw gateway install` спочатку намагаються використовувати Windows Scheduled Tasks
- якщо створення Scheduled Task заборонено, OpenClaw переходить до резервного варіанта з елементом автозапуску в теці Startup для поточного користувача і негайно запускає gateway
- якщо сам `schtasks` зависає або перестає відповідати, OpenClaw тепер швидко перериває цей шлях і переходить до резервного варіанта замість того, щоб зависнути назавжди
- Scheduled Tasks усе ще є пріоритетними, коли вони доступні, оскільки забезпечують кращий статус supervisor

Якщо вам потрібен лише native CLI без встановлення сервісу gateway, використовуйте один із цих варіантів:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Якщо ж вам потрібен керований автозапуск на native Windows:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Якщо створення Scheduled Task заблоковане, резервний режим сервісу все одно автоматично запускатиметься після входу в систему через теку Startup поточного користувача.

## Gateway

- [Runbook Gateway](/uk/gateway)
- [Конфігурація](/uk/gateway/configuration)

## Встановлення сервісу Gateway (CLI)

Усередині WSL2:

```
openclaw onboard --install-daemon
```

Або:

```
openclaw gateway install
```

Або:

```
openclaw configure
```

Коли з’явиться запит, виберіть **Сервіс Gateway**.

Відновлення/міграція:

```
openclaw doctor
```

## Автозапуск Gateway до входу в Windows

Для headless-налаштувань переконайтеся, що повний ланцюг завантаження працює,
навіть коли ніхто не входить у Windows.

### 1) Залишайте користувацькі сервіси активними без входу

Усередині WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Установіть користувацький сервіс gateway OpenClaw

Усередині WSL:

```bash
openclaw gateway install
```

### 3) Запускайте WSL автоматично під час завантаження Windows

У PowerShell від імені адміністратора:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Замініть `Ubuntu` на назву вашого дистрибутива з:

```powershell
wsl --list --verbose
```

### Перевірка ланцюга запуску

Після перезавантаження (до входу в Windows) перевірте з WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Додатково: відкриття сервісів WSL у LAN (portproxy)

WSL має власну віртуальну мережу. Якщо іншій машині потрібно дістатися до сервісу,
що працює **всередині WSL** (SSH, локальний TTS-сервер або Gateway), потрібно
перенаправити порт Windows на поточну IP-адресу WSL. IP-адреса WSL змінюється після перезапусків,
тому вам може знадобитися оновлювати правило перенаправлення.

Приклад (PowerShell **від імені адміністратора**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

Дозвольте порт у Windows Firewall (одноразово):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

Оновіть portproxy після перезапуску WSL:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Примітки:

- SSH з іншої машини має бути спрямований на **IP-адресу хоста Windows** (наприклад: `ssh user@windows-host -p 2222`).
- Віддалені Node мають указувати на **досяжний** URL Gateway (а не `127.0.0.1`); для перевірки використайте
  `openclaw status --all`.
- Використовуйте `listenaddress=0.0.0.0` для доступу з LAN; `127.0.0.1` залишає доступ лише локальним.
- Якщо ви хочете автоматизувати це, зареєструйте Scheduled Task для запуску кроку
  оновлення під час входу в систему.

## Покрокове встановлення WSL2

### 1) Установіть WSL2 + Ubuntu

Відкрийте PowerShell (Admin):

```powershell
wsl --install
# Or pick a distro explicitly:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Перезавантажте систему, якщо Windows попросить.

### 2) Увімкніть systemd (потрібно для встановлення gateway)

У вашому терміналі WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Потім у PowerShell:

```powershell
wsl --shutdown
```

Знову відкрийте Ubuntu, потім перевірте:

```bash
systemctl --user status
```

### 3) Установіть OpenClaw (усередині WSL)

Для звичайного першого налаштування всередині WSL дотримуйтесь Linux-потоку Getting Started:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Якщо ви розробляєте з джерела замість первинного налаштування, використовуйте
цикл розробки з джерела з [Налаштування](/uk/start/setup):

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Повний посібник: [Початок роботи](/uk/start/getting-started)

## Companion app для Windows

У нас ще немає companion app для Windows. Contributions вітаються, якщо ви хочете
допомогти зробити це можливим.

## Пов’язано

- [Огляд встановлення](/uk/install)
- [Платформи](/uk/platforms)
