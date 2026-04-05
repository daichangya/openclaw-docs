---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Усунення проблем запуску CDP у Chrome/Brave/Edge/Chromium для керування браузером OpenClaw у Linux
title: Усунення проблем із браузером
x-i18n:
    generated_at: "2026-04-05T18:18:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ff8e6741558c1b5db86826c5e1cbafe35e35afe5cb2a53296c16653da59e516
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

# Усунення проблем із браузером (Linux)

## Проблема: "Failed to start Chrome CDP on port 18800"

Сервер керування браузером OpenClaw не може запустити Chrome/Brave/Edge/Chromium з помилкою:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Основна причина

В Ubuntu (і в багатьох дистрибутивах Linux) типове встановлення Chromium є **snap-пакетом**. Ізоляція AppArmor у snap заважає тому, як OpenClaw запускає та відстежує процес браузера.

Команда `apt install chromium` встановлює пакет-заглушку, який перенаправляє на snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Це НЕ справжній браузер — це лише обгортка.

### Рішення 1: Установіть Google Chrome (рекомендовано)

Установіть офіційний пакет Google Chrome `.deb`, який не ізольований через snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # якщо є помилки залежностей
```

Потім оновіть конфігурацію OpenClaw (`~/.openclaw/openclaw.json`):

```json
{
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/google-chrome-stable",
    "headless": true,
    "noSandbox": true
  }
}
```

### Рішення 2: Використовуйте snap Chromium з режимом лише підключення

Якщо вам необхідно використовувати snap Chromium, налаштуйте OpenClaw на підключення до браузера, запущеного вручну:

1. Оновіть конфігурацію:

```json
{
  "browser": {
    "enabled": true,
    "attachOnly": true,
    "headless": true,
    "noSandbox": true
  }
}
```

2. Запустіть Chromium вручну:

```bash
chromium-browser --headless --no-sandbox --disable-gpu \
  --remote-debugging-port=18800 \
  --user-data-dir=$HOME/.openclaw/browser/openclaw/user-data \
  about:blank &
```

3. За потреби створіть користувацький сервіс systemd для автоматичного запуску Chrome:

```ini
# ~/.config/systemd/user/openclaw-browser.service
[Unit]
Description=OpenClaw Browser (Chrome CDP)
After=network.target

[Service]
ExecStart=/snap/bin/chromium --headless --no-sandbox --disable-gpu --remote-debugging-port=18800 --user-data-dir=%h/.openclaw/browser/openclaw/user-data about:blank
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Увімкніть командою: `systemctl --user enable --now openclaw-browser.service`

### Перевірка, що браузер працює

Перевірте статус:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Перевірте перегляд:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Довідник з конфігурації

| Параметр                 | Опис                                                                 | Типове значення                                              |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------ |
| `browser.enabled`        | Увімкнути керування браузером                                        | `true`                                                       |
| `browser.executablePath` | Шлях до двійкового файла браузера на базі Chromium (Chrome/Brave/Edge/Chromium) | визначається автоматично (надає перевагу типовому браузеру, якщо він на базі Chromium) |
| `browser.headless`       | Запуск без GUI                                                       | `false`                                                      |
| `browser.noSandbox`      | Додає прапорець `--no-sandbox` (потрібно для деяких конфігурацій Linux) | `false`                                                      |
| `browser.attachOnly`     | Не запускати браузер, лише підключатися до наявного                  | `false`                                                      |
| `browser.cdpPort`        | Порт Chrome DevTools Protocol                                        | `18800`                                                      |

### Проблема: "No Chrome tabs found for profile=\"user\""

Ви використовуєте профіль `existing-session` / Chrome MCP. OpenClaw бачить локальний Chrome,
але немає відкритих вкладок, до яких можна підключитися.

Варіанти виправлення:

1. **Використовуйте керований браузер:** `openclaw browser start --browser-profile openclaw`
   (або задайте `browser.defaultProfile: "openclaw"`).
2. **Використовуйте Chrome MCP:** переконайтеся, що локальний Chrome запущено принаймні з однією відкритою вкладкою, а потім повторіть спробу з `--browser-profile user`.

Примітки:

- `user` доступний лише на хості. Для серверів Linux, контейнерів або віддалених хостів надавайте перевагу профілям CDP.
- Для `user` / інших профілів `existing-session` зберігаються поточні обмеження Chrome MCP:
  дії на основі ref, хуки завантаження одного файла, без перевизначення тайм-аутів діалогів, без
  `wait --load networkidle`, а також без `responsebody`, експорту PDF, перехоплення завантажень
  чи пакетних дій.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP.
- Віддалені профілі CDP приймають `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S) для виявлення через `/json/version`, або WS(S), коли ваш сервіс
  браузера надає пряму URL-адресу сокета DevTools.
