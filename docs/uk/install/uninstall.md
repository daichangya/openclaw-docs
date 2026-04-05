---
read_when:
    - Ви хочете прибрати OpenClaw з машини
    - Після видалення сервіс gateway усе ще працює
summary: Повне видалення OpenClaw (CLI, сервіс, стан, робочий простір)
title: Видалення
x-i18n:
    generated_at: "2026-04-05T18:08:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 34c7d3e4ad17333439048dfda739fc27db47e7f9e4212fe17db0e4eb3d3ab258
    source_path: install/uninstall.md
    workflow: 15
---

# Видалення

Є два шляхи:

- **Простий шлях**, якщо `openclaw` усе ще встановлено.
- **Ручне видалення сервісу**, якщо CLI уже немає, але сервіс усе ще працює.

## Простий шлях (CLI усе ще встановлено)

Рекомендовано: скористайтеся вбудованим деінсталятором:

```bash
openclaw uninstall
```

Неінтерактивно (автоматизація / npx):

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

Ручні кроки (той самий результат):

1. Зупиніть сервіс gateway:

```bash
openclaw gateway stop
```

2. Видаліть сервіс gateway (launchd/systemd/schtasks):

```bash
openclaw gateway uninstall
```

3. Видаліть стан + конфігурацію:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Якщо ви встановили `OPENCLAW_CONFIG_PATH` у власне розташування поза каталогом стану, видаліть і цей файл.

4. Видаліть свій робочий простір (необов’язково, видаляє файли агента):

```bash
rm -rf ~/.openclaw/workspace
```

5. Видаліть установлений CLI (виберіть той варіант, який використовували):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Якщо ви встановлювали macOS app:

```bash
rm -rf /Applications/OpenClaw.app
```

Примітки:

- Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), повторіть крок 3 для кожного каталогу стану (типові значення — `~/.openclaw-<profile>`).
- У remote mode каталог стану розташований на **gateway host**, тому виконайте кроки 1-4 також там.

## Ручне видалення сервісу (CLI не встановлено)

Використовуйте це, якщо сервіс gateway продовжує працювати, але `openclaw` відсутній.

### macOS (launchd)

Типова мітка — `ai.openclaw.gateway` (або `ai.openclaw.<profile>`; застарілі `com.openclaw.*` можуть і досі існувати):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Якщо ви використовували профіль, замініть мітку і назву plist на `ai.openclaw.<profile>`. Видаліть також усі наявні застарілі plist `com.openclaw.*`.

### Linux (користувацький systemd unit)

Типова назва unit — `openclaw-gateway.service` (або `openclaw-gateway-<profile>.service`):

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Типова назва завдання — `OpenClaw Gateway` (або `OpenClaw Gateway (<profile>)`).
Скрипт завдання розташований у вашому каталозі стану.

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

Якщо ви використовували профіль, видаліть відповідну назву завдання і `~\.openclaw-<profile>\gateway.cmd`.

## Звичайне встановлення vs source checkout

### Звичайне встановлення (install.sh / npm / pnpm / bun)

Якщо ви використовували `https://openclaw.ai/install.sh` або `install.ps1`, CLI було встановлено через `npm install -g openclaw@latest`.
Видаліть його за допомогою `npm rm -g openclaw` (або `pnpm remove -g` / `bun remove -g`, якщо встановлювали так).

### Source checkout (git clone)

Якщо ви запускаєте з checkout репозиторію (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Видаліть сервіс gateway **перед** видаленням репозиторію (скористайтеся простим шляхом вище або ручним видаленням сервісу).
2. Видаліть каталог репозиторію.
3. Видаліть стан + робочий простір, як показано вище.
