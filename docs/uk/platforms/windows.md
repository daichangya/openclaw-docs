---
read_when:
    - Встановлення OpenClaw на Windows
    - Вибір між нативним Windows і WSL2
    - Пошук інформації про стан супутнього застосунку для Windows
summary: 'Підтримка Windows: нативний шлях встановлення та через WSL2, служба та поточні застереження'
title: Windows
x-i18n:
    generated_at: "2026-04-05T18:11:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d9819206bdd65cf03519c1bc73ed0c7889b0ab842215ea94343262300adfd14
    source_path: platforms/windows.md
    workflow: 15
---

# Windows

OpenClaw підтримує як **нативний Windows**, так і **WSL2**. WSL2 — стабільніший шлях, і його рекомендовано для повного досвіду використання: CLI, Gateway та інструментарій працюють усередині Linux з повною сумісністю. Нативний Windows підходить для основних сценаріїв CLI і Gateway, з деякими застереженнями, наведеними нижче.

Нативні супутні застосунки для Windows заплановані.

## WSL2 (рекомендовано)

- [Початок роботи](/start/getting-started) (використовуйте всередині WSL)
- [Встановлення та оновлення](/uk/install/updating)
- Офіційний посібник із WSL2 (Microsoft): [https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## Стан нативного Windows

Сценарії CLI для нативного Windows покращуються, але WSL2 все ще є рекомендованим шляхом.

Що сьогодні добре працює на нативному Windows:

- інсталятор із вебсайту через `install.ps1`
- локальне використання CLI, наприклад `openclaw --version`, `openclaw doctor` і `openclaw plugins list --json`
- вбудовані перевірки local-agent/provider, наприклад:

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

Поточні застереження:

- `openclaw onboard --non-interactive` досі очікує доступний локальний шлюз, якщо не передати `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` і `openclaw gateway install` спочатку намагаються використовувати Windows Scheduled Tasks
- якщо створення Scheduled Task заборонено, OpenClaw переходить до резервного варіанта з елементом входу per-user у папці Startup і негайно запускає шлюз
- якщо сам `schtasks` зависає або перестає відповідати, OpenClaw тепер швидко перериває цей шлях і переходить до резервного варіанта замість того, щоб зависнути назавжди
- Scheduled Tasks усе ще є бажаним варіантом, коли вони доступні, оскільки вони забезпечують кращий стан наглядача

Якщо вам потрібен лише нативний CLI, без встановлення служби шлюзу, використовуйте один із цих варіантів:

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

Якщо ж вам потрібен керований автозапуск у нативному Windows:

```powershell
openclaw gateway install
openclaw gateway status --json
```

Якщо створення Scheduled Task заблоковано, резервний режим служби все одно автоматично запускається після входу через папку Startup поточного користувача.

## Gateway

- [Посібник із Gateway](/uk/gateway)
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

Коли буде запит, виберіть **Gateway service**.

Виправлення/міграція:

```
openclaw doctor
```

## Автозапуск Gateway до входу в Windows

Для безголових конфігурацій переконайтеся, що весь ланцюжок завантаження працює, навіть коли ніхто не входить у Windows.

### 1) Зберігайте роботу служб користувача без входу

Усередині WSL:

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) Установіть службу користувача шлюзу OpenClaw

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

## Додатково: відкриття служб WSL у LAN (portproxy)

WSL має власну віртуальну мережу. Якщо іншому комп’ютеру потрібно звернутися до служби, що працює **всередині WSL** (SSH, локальний сервер TTS або Gateway), ви маєте переспрямувати порт Windows на поточну IP-адресу WSL. IP-адреса WSL змінюється після перезапусків, тому може знадобитися оновлювати правило переспрямування.

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

- SSH з іншого комп’ютера має бути спрямований на **IP-адресу хоста Windows** (наприклад: `ssh user@windows-host -p 2222`).
- Віддалені вузли мають вказувати на **доступну** URL-адресу Gateway (не `127.0.0.1`); використовуйте `openclaw status --all` для перевірки.
- Використовуйте `listenaddress=0.0.0.0` для доступу з LAN; `127.0.0.1` залишає доступ лише локальним.
- Якщо ви хочете автоматизувати це, зареєструйте Scheduled Task для запуску кроку оновлення під час входу в систему.

## Покрокове встановлення WSL2

### 1) Установіть WSL2 + Ubuntu

Відкрийте PowerShell (Admin):

```powershell
wsl --install
# Або явно виберіть дистрибутив:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

Перезавантажте систему, якщо Windows попросить.

### 2) Увімкніть systemd (потрібно для встановлення Gateway)

У вашому терміналі WSL:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

Потім із PowerShell:

```powershell
wsl --shutdown
```

Знову відкрийте Ubuntu, а потім перевірте:

```bash
systemctl --user status
```

### 3) Установіть OpenClaw (усередині WSL)

Дотримуйтесь потоку Linux Getting Started всередині WSL:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # автоматично встановлює залежності UI під час першого запуску
pnpm build
openclaw onboard
```

Повний посібник: [Початок роботи](/start/getting-started)

## Супутній застосунок для Windows

У нас ще немає супутнього застосунку для Windows. Вітаються внески, якщо ви хочете допомогти зробити це можливим.
