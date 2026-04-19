---
read_when:
    - Встановлення OpenClaw на Windows
    - Вибір між власним Windows і WSL2
    - Пошук статусу супутнього застосунку для Windows
summary: 'Підтримка Windows: власні шляхи встановлення та через WSL2, демон і поточні застереження'
title: Windows
x-i18n:
    generated_at: "2026-04-19T06:50:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e7451c785a1d75c809522ad93e2c44a00b211f77f14c5c489fd0b01840d3fe2
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw підтримує як **власний Windows**, так і **WSL2**. WSL2 — це стабільніший шлях, рекомендований для повноцінного використання: CLI, Gateway і супутні інструменти працюють усередині Linux із повною сумісністю. Власний Windows підходить для базового використання CLI і Gateway, з деякими застереженнями, наведеними нижче.

Супутні застосунки для Windows заплановані.

## WSL2 (рекомендовано)

- [Початок роботи](/uk/start/getting-started) (використовуйте всередині WSL)
- [Встановлення й оновлення](/uk/install/updating)
- Офіційний посібник із WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Статус власного Windows

Потоки CLI для власного Windows покращуються, але WSL2 усе ще залишається рекомендованим шляхом.

Що сьогодні добре працює у власному Windows:

- інсталятор із сайту через `install.ps1`
- локальне використання CLI, наприклад `openclaw --version`, `openclaw doctor` і `openclaw plugins list --json`
- вбудований локальний smoke-тест agent/provider, наприклад:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Поточні застереження:

- `openclaw onboard --non-interactive` досі очікує доступний локальний gateway, якщо не передати `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` і `openclaw gateway install` спочатку намагаються використати Windows Scheduled Tasks
- якщо створення Scheduled Task заборонене, OpenClaw переключається на елемент автозапуску під час входу через Startup folder для поточного користувача і негайно запускає gateway
- якщо сам `schtasks` зависає або перестає відповідати, OpenClaw тепер швидко перериває цей шлях і переходить до резервного варіанту замість того, щоб зависати назавжди
- Scheduled Tasks усе ще є пріоритетним варіантом, коли вони доступні, оскільки забезпечують кращий статус супервізора

Якщо вам потрібен лише власний CLI, без встановлення служби gateway, використовуйте один із цих варіантів:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Якщо ж вам потрібен керований автозапуск у власному Windows:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Якщо створення Scheduled Task заблоковане, резервний режим служби все одно автоматично запускається після входу через Startup folder поточного користувача.

## Gateway

- [Інструкція з Gateway](/uk/gateway)
- [Конфігурація](/uk/gateway/configuration)

## Встановлення служби Gateway (CLI)

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

Коли з’явиться запит, виберіть **Gateway service**.

Відновлення/міграція:

```
openclaw doctor
```

## Автозапуск Gateway до входу в Windows

Для безголових конфігурацій переконайтеся, що весь ланцюжок запуску виконується, навіть коли ніхто не входить у Windows.

### 1) Залишайте користувацькі служби активними без входу

Усередині WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Встановіть користувацьку службу gateway OpenClaw

Усередині WSL:

```bash
openclaw gateway install
```

### 3) Автоматично запускайте WSL під час завантаження Windows

У PowerShell від імені адміністратора:

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

Замініть `Ubuntu` на назву вашого дистрибутива з:

```powershell
wsl --list --verbose
```

### Перевірка ланцюжка запуску

Після перезавантаження (до входу в Windows) перевірте з WSL:

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## Додатково: відкриття сервісів WSL у LAN (portproxy)

WSL має власну віртуальну мережу. Якщо іншій машині потрібно підключитися до сервісу,
що працює **всередині WSL** (SSH, локальний сервер TTS або Gateway), ви маєте
перенаправити порт Windows на поточну IP-адресу WSL. IP-адреса WSL змінюється після перезапусків,
тому може знадобитися оновлювати правило перенаправлення.

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

Оновлюйте portproxy після перезапуску WSL:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

Примітки:

- SSH з іншої машини має підключатися до **IP-адреси хоста Windows** (наприклад: `ssh user@windows-host -p 2222`).
- Віддалені nodes мають вказувати на **доступний** URL Gateway (не `127.0.0.1`); використовуйте
  `openclaw status --all` для перевірки.
- Використовуйте `listenaddress=0.0.0.0` для доступу з LAN; `127.0.0.1` залишає доступ лише локальним.
- Якщо ви хочете автоматизувати це, зареєструйте Scheduled Task для запуску
  кроку оновлення під час входу в систему.

## Покрокове встановлення WSL2

### 1) Встановіть WSL2 + Ubuntu

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

### 3) Встановіть OpenClaw (усередині WSL)

Для звичайного першого налаштування всередині WSL дотримуйтеся Linux-процесу з розділу Початок роботи:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

Якщо ви розробляєте із сирцевого коду замість першого проходження onboarding, використовуйте
цикл розробки з сирцевого коду з [Налаштування](/uk/start/setup):

```bash
pnpm install
# First run only (or after resetting local OpenClaw config/workspace)
pnpm openclaw setup
pnpm gateway:watch
```

Повний посібник: [Початок роботи](/uk/start/getting-started)

## Супутній застосунок для Windows

У нас ще немає супутнього застосунку для Windows. Ми будемо раді внескам, якщо ви хочете
допомогти зробити це можливим.
