---
read_when:
    - Запуск кількох Gateway на одній машині
    - Для кожного Gateway потрібні ізольовані конфігурація, стан і порти
summary: Запускайте кілька Gateway OpenClaw на одному хості (ізоляція, порти та профілі)
title: Кілька Gateway
x-i18n:
    generated_at: "2026-04-21T18:05:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a0bae1fbb088d1c1b7a90bb1de8f33471a19c5fbeafd8e2a0556d8eeadf8c15
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Кілька Gateway (на одному хості)

У більшості конфігурацій слід використовувати один Gateway, оскільки один Gateway може обробляти кілька підключень до месенджерів і агентів. Якщо вам потрібна сильніша ізоляція або резервування (наприклад, rescue bot), запускайте окремі Gateway з ізольованими профілями/портами.

## Найкраща рекомендована конфігурація

Для більшості користувачів найпростіша конфігурація rescue bot така:

- залиште основний bot на профілі за замовчуванням
- запустіть rescue bot з `--profile rescue`
- використовуйте повністю окремий Telegram bot для облікового запису rescue
- тримайте rescue bot на іншому базовому порту, наприклад `19789`

Це зберігає ізоляцію rescue bot від основного bot, тож він може налагоджувати або застосовувати зміни конфігурації, якщо основний bot недоступний. Залишайте щонайменше 20 портів між базовими портами, щоб похідні порти browser/canvas/CDP ніколи не конфліктували.

## Швидкий старт для rescue bot

Використовуйте це як типовий шлях, якщо у вас немає вагомої причини робити інакше:

```bash
# Rescue bot (окремий Telegram bot, окремий профіль, порт 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Якщо ваш основний bot уже працює, зазвичай цього достатньо.

Під час `openclaw --profile rescue onboard`:

- використовуйте окремий токен Telegram bot
- залиште профіль `rescue`
- використовуйте базовий порт щонайменше на 20 вищий, ніж у основного bot
- прийміть робочий простір rescue за замовчуванням, якщо ви вже не керуєте власним

Якщо onboarding уже встановив для вас службу rescue, фінальний
`gateway install` не потрібен.

## Чому це працює

Rescue bot залишається незалежним, оскільки має власні:

- профіль/конфігурацію
- каталог стану
- робочий простір
- базовий порт (і похідні порти)
- токен Telegram bot

Для більшості конфігурацій використовуйте повністю окремий Telegram bot для профілю rescue:

- його легко залишити лише для операторів
- окремий токен bot і окрема ідентичність
- незалежність від установлення каналу/застосунку основного bot
- простий шлях відновлення через DM, коли основний bot зламаний

## Що змінює `--profile rescue onboard`

`openclaw --profile rescue onboard` використовує звичайний процес onboarding, але
записує все в окремий профіль.

На практиці це означає, що rescue bot отримує власні:

- файл конфігурації
- каталог стану
- робочий простір (типово `~/.openclaw/workspace-rescue`)
- ім’я керованої служби

В іншому запити такі самі, як і під час звичайного onboarding.

## Контрольний список ізоляції

Зберігайте унікальність цих параметрів для кожного екземпляра Gateway:

- `OPENCLAW_CONFIG_PATH` — окремий файл конфігурації для кожного екземпляра
- `OPENCLAW_STATE_DIR` — окремі сеанси, облікові дані, кеші для кожного екземпляра
- `agents.defaults.workspace` — окремий корінь робочого простору для кожного екземпляра
- `gateway.port` (або `--port`) — унікальний для кожного екземпляра
- похідні порти browser/canvas/CDP

Якщо вони спільні, ви зіткнетеся з гонками конфігурації та конфліктами портів.

## Відображення портів (похідні)

Базовий порт = `gateway.port` (або `OPENCLAW_GATEWAY_PORT` / `--port`).

- порт служби керування browser = базовий + 2 (лише local loopback)
- canvas host обслуговується на HTTP-сервері Gateway (той самий порт, що й `gateway.port`)
- порти CDP профілю browser автоматично виділяються з діапазону `browser.controlPort + 9 .. + 108`

Якщо ви перевизначаєте будь-що з цього в конфігурації або env, ви повинні зберегти унікальність для кожного екземпляра.

## Нотатки про browser/CDP (типова пастка)

- **Не** фіксуйте `browser.cdpUrl` на однакові значення в кількох екземплярах.
- Кожному екземпляру потрібен власний порт керування browser і власний діапазон CDP (похідний від його порту gateway).
- Якщо вам потрібні явні порти CDP, задавайте `browser.profiles.<name>.cdpPort` для кожного екземпляра.
- Віддалений Chrome: використовуйте `browser.profiles.<name>.cdpUrl` (для кожного профілю, для кожного екземпляра).

## Приклад manual env

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Швидкі перевірки

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

Тлумачення:

- `gateway status --deep` допомагає виявити застарілі служби launchd/systemd/schtasks від старіших установлень.
- Попереджувальний текст `gateway probe`, наприклад `multiple reachable gateways detected`, є очікуваним лише тоді, коли ви навмисно запускаєте більше ніж один ізольований gateway.
