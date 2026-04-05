---
read_when:
    - Ви часто запускаєте OpenClaw з Docker і хочете коротші щоденні команди
    - Вам потрібен допоміжний шар для dashboard, logs, налаштування token і сценаріїв pairing
summary: Допоміжні shell-команди ClawDock для Docker-установок OpenClaw
title: ClawDock
x-i18n:
    generated_at: "2026-04-05T18:06:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 93d67d1d979450d8c9c11854d2f40977c958f1c300e75a5c42ce4c31de86735a
    source_path: install/clawdock.md
    workflow: 15
---

# ClawDock

ClawDock — це невеликий шар shell-допоміжних команд для Docker-установок OpenClaw.

Він дає короткі команди на кшталт `clawdock-start`, `clawdock-dashboard` і `clawdock-fix-token` замість довших викликів `docker compose ...`.

Якщо ви ще не налаштували Docker, почніть із [Docker](/install/docker).

## Встановлення

Використовуйте канонічний шлях до helper:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

Якщо ви раніше встановлювали ClawDock із `scripts/shell-helpers/clawdock-helpers.sh`, перевстановіть його з нового шляху `scripts/clawdock/clawdock-helpers.sh`. Старий raw GitHub path було видалено.

## Що ви отримаєте

### Базові операції

| Команда            | Опис                         |
| ------------------ | ---------------------------- |
| `clawdock-start`   | Запустити gateway            |
| `clawdock-stop`    | Зупинити gateway             |
| `clawdock-restart` | Перезапустити gateway        |
| `clawdock-status`  | Перевірити стан контейнера   |
| `clawdock-logs`    | Стежити за журналами gateway |

### Доступ до контейнера

| Команда                   | Опис                                            |
| ------------------------- | ----------------------------------------------- |
| `clawdock-shell`          | Відкрити shell усередині контейнера gateway     |
| `clawdock-cli <command>`  | Виконати команди CLI OpenClaw у Docker          |
| `clawdock-exec <command>` | Виконати довільну команду в контейнері          |

### Веб-UI і pairing

| Команда                 | Опис                              |
| ----------------------- | --------------------------------- |
| `clawdock-dashboard`    | Відкрити URL Control UI           |
| `clawdock-devices`      | Перелічити очікувальні pairing пристроїв |
| `clawdock-approve <id>` | Підтвердити запит на pairing      |

### Налаштування й обслуговування

| Команда              | Опис                                              |
| -------------------- | ------------------------------------------------- |
| `clawdock-fix-token` | Налаштувати токен gateway всередині контейнера    |
| `clawdock-update`    | Отримати зміни, перебудувати й перезапустити      |
| `clawdock-rebuild`   | Лише перебудувати Docker-образ                    |
| `clawdock-clean`     | Видалити контейнери й томи                        |

### Допоміжні засоби

| Команда                | Опис                                          |
| ---------------------- | --------------------------------------------- |
| `clawdock-health`      | Запустити перевірку стану gateway             |
| `clawdock-token`       | Вивести токен gateway                         |
| `clawdock-cd`          | Перейти до каталогу проєкту OpenClaw          |
| `clawdock-config`      | Відкрити `~/.openclaw`                        |
| `clawdock-show-config` | Вивести файли конфігурації зі замаскованими значеннями |
| `clawdock-workspace`   | Відкрити каталог workspace                    |

## Сценарій першого запуску

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

Якщо браузер повідомляє, що потрібен pairing:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Конфігурація та секрети

ClawDock працює з тим самим поділом Docker-конфігурації, який описано в [Docker](/install/docker):

- `<project>/.env` для специфічних для Docker значень, як-от назва образу, порти й токен gateway
- `~/.openclaw/.env` для ключів провайдерів і токенів ботів, що задаються через env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` для збереженої OAuth/API-key автентифікації провайдерів
- `~/.openclaw/openclaw.json` для поведінкової конфігурації

Використовуйте `clawdock-show-config`, коли хочете швидко переглянути файли `.env` і `openclaw.json`. Він маскує значення `.env` у своєму виводі.

## Пов’язані сторінки

- [Docker](/install/docker)
- [Docker VM Runtime](/install/docker-vm-runtime)
- [Updating](/install/updating)
