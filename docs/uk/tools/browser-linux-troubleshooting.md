---
read_when: Browser control fails on Linux, especially with snap Chromium
summary: Усунення проблем запуску CDP у Chrome/Brave/Edge/Chromium для керування браузером OpenClaw у Linux
title: Усунення несправностей браузера
x-i18n:
    generated_at: "2026-04-23T23:07:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: e6f59048d6a5b587b8d6c9ac0d32b3215f68a7e39192256b28f22936cab752e1
    source_path: tools/browser-linux-troubleshooting.md
    workflow: 15
---

## Проблема: "Failed to start Chrome CDP on port 18800"

Сервер керування браузером OpenClaw не може запустити Chrome/Brave/Edge/Chromium і показує помилку:

```
{"error":"Error: Failed to start Chrome CDP on port 18800 for profile \"openclaw\"."}
```

### Коренева причина

В Ubuntu (і багатьох інших дистрибутивах Linux) типове встановлення Chromium є **snap package**. Обмеження AppArmor у snap заважають тому, як OpenClaw запускає та відстежує процес браузера.

Команда `apt install chromium` встановлює пакет-заглушку, який перенаправляє на snap:

```
Note, selecting 'chromium-browser' instead of 'chromium'
chromium-browser is already the newest version (2:1snap1-0ubuntu2).
```

Це НЕ справжній браузер — це лише обгортка.

### Рішення 1: Встановіть Google Chrome (рекомендовано)

Встановіть офіційний пакет `.deb` Google Chrome, який не sandboxed через snap:

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install -y  # if there are dependency errors
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

### Рішення 2: Використовуйте snap Chromium у режимі attach-only

Якщо вам обов’язково потрібен snap Chromium, налаштуйте OpenClaw на підключення до браузера, запущеного вручну:

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

3. За бажанням створіть user service systemd для автоматичного запуску Chrome:

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

Увімкнути: `systemctl --user enable --now openclaw-browser.service`

### Перевірка роботи браузера

Перевірте статус:

```bash
curl -s http://127.0.0.1:18791/ | jq '{running, pid, chosenBrowser}'
```

Протестуйте перегляд:

```bash
curl -s -X POST http://127.0.0.1:18791/start
curl -s http://127.0.0.1:18791/tabs
```

### Довідник із конфігурації

| Option                   | Description                                                          | Default                                                     |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `browser.enabled`        | Увімкнути керування браузером                                        | `true`                                                      |
| `browser.executablePath` | Шлях до бінарного файла браузера на базі Chromium (Chrome/Brave/Edge/Chromium) | визначається автоматично (надає перевагу типовому браузеру, якщо він на базі Chromium) |
| `browser.headless`       | Запуск без GUI                                                       | `false`                                                     |
| `browser.noSandbox`      | Додати прапорець `--no-sandbox` (потрібно для деяких конфігурацій Linux) | `false`                                                     |
| `browser.attachOnly`     | Не запускати браузер, лише підключатися до наявного                  | `false`                                                     |
| `browser.cdpPort`        | Порт Chrome DevTools Protocol                                        | `18800`                                                     |

### Проблема: "No Chrome tabs found for profile=\"user\""

Ви використовуєте профіль `existing-session` / Chrome MCP. OpenClaw бачить локальний Chrome,
але немає відкритих вкладок, до яких можна підключитися.

Варіанти виправлення:

1. **Використовуйте керований браузер:** `openclaw browser start --browser-profile openclaw`
   (або встановіть `browser.defaultProfile: "openclaw"`).
2. **Використовуйте Chrome MCP:** переконайтеся, що локальний Chrome запущений і має принаймні одну відкриту вкладку, а потім повторіть спробу з `--browser-profile user`.

Примітки:

- `user` працює лише на host. Для серверів Linux, контейнерів або віддалених host надавайте перевагу профілям CDP.
- `user` / інші профілі `existing-session` зберігають поточні обмеження Chrome MCP:
  дії на основі ref, hooks завантаження лише одного файла, без перевизначення тайм-аутів діалогів, без
  `wait --load networkidle`, а також без `responsebody`, експорту PDF, перехоплення завантажень
  чи пакетних дій.
- Локальні профілі `openclaw` автоматично призначають `cdpPort`/`cdpUrl`; задавайте їх лише для віддаленого CDP.
- Віддалені профілі CDP приймають `http://`, `https://`, `ws://` і `wss://`.
  Використовуйте HTTP(S) для виявлення `/json/version`, або WS(S), коли ваш сервіс браузера
  надає прямий URL сокета DevTools.

## Пов’язане

- [Browser](/uk/tools/browser)
- [Вхід у Browser](/uk/tools/browser-login)
- [Усунення несправностей Browser у WSL2](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
