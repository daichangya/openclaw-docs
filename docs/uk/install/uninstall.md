---
read_when:
    - Ви хочете видалити OpenClaw з машини
    - Сервіс gateway усе ще працює після видалення
summary: Повністю видалити OpenClaw (CLI, service, стан, робочий простір)
title: Видалення OpenClaw
x-i18n:
    generated_at: "2026-04-24T03:19:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6d73bc46f4878510706132e5c6cfec3c27cdb55578ed059dc12a785712616d75
    source_path: install/uninstall.md
    workflow: 15
---

Є два шляхи:

- **Простий шлях**, якщо `openclaw` усе ще встановлено.
- **Ручне видалення сервісу**, якщо CLI вже немає, але сервіс усе ще працює.

## Простий шлях (CLI усе ще встановлено)

Рекомендовано: скористайтеся вбудованим деінсталятором:

```bash
openclaw uninstall
```

Неінтерактивний режим (автоматизація / npx):

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

3. Видаліть стан і конфігурацію:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

Якщо ви встановили `OPENCLAW_CONFIG_PATH` на власне розташування поза каталогом стану, видаліть і цей файл.

4. Видаліть робочий простір (необов’язково, видаляє файли агента):

```bash
rm -rf ~/.openclaw/workspace
```

5. Видаліть встановлений CLI (виберіть той спосіб, який ви використовували):

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. Якщо ви встановлювали застосунок macOS:

```bash
rm -rf /Applications/OpenClaw.app
```

Примітки:

- Якщо ви використовували профілі (`--profile` / `OPENCLAW_PROFILE`), повторіть крок 3 для кожного каталогу стану (типові значення — `~/.openclaw-<profile>`).
- У віддаленому режимі каталог стану розташований на **хості gateway**, тож виконайте кроки 1–4 і там також.

## Ручне видалення сервісу (CLI не встановлено)

Використовуйте цей шлях, якщо сервіс gateway продовжує працювати, але `openclaw` відсутній.

### macOS (launchd)

Типова мітка — `ai.openclaw.gateway` (або `ai.openclaw.<profile>`; застарілі `com.openclaw.*` усе ще можуть існувати):

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

Якщо ви використовували профіль, замініть мітку та ім’я plist на `ai.openclaw.<profile>`. Якщо є, видаліть усі застарілі plist `com.openclaw.*`.

### Linux (користувацький unit systemd)

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

Якщо ви використовували профіль, видаліть відповідну назву завдання та `~\.openclaw-<profile>\gateway.cmd`.

## Звичайне встановлення vs checkout з джерела

### Звичайне встановлення (install.sh / npm / pnpm / bun)

Якщо ви використовували `https://openclaw.ai/install.sh` або `install.ps1`, CLI було встановлено через `npm install -g openclaw@latest`.
Видаліть його за допомогою `npm rm -g openclaw` (або `pnpm remove -g` / `bun remove -g`, якщо встановлювали саме так).

### Checkout з джерела (git clone)

Якщо ви запускаєте з checkout репозиторію (`git clone` + `openclaw ...` / `bun run openclaw ...`):

1. Видаліть сервіс gateway **перед** видаленням репозиторію (скористайтеся простим шляхом вище або ручним видаленням сервісу).
2. Видаліть каталог репозиторію.
3. Видаліть стан і робочий простір, як показано вище.

## Пов’язано

- [Огляд встановлення](/uk/install)
- [Посібник з міграції](/uk/install/migrating)
