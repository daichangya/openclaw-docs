---
read_when:
    - Запуск більше ніж одного Gateway на тій самій машині
    - Вам потрібні ізольовані конфігурація/стан/порти для кожного Gateway
summary: Запуск кількох Gateway OpenClaw на одному хості (ізоляція, порти та профілі)
title: Кілька gateway
x-i18n:
    generated_at: "2026-04-24T03:16:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1700a0d29ceee3e2a242a8455a3c948895fb25750a2b1bce5c4bd0690a051881
    source_path: gateway/multiple-gateways.md
    workflow: 15
---

# Кілька gateway (один хост)

У більшості конфігурацій слід використовувати один Gateway, тому що один Gateway може обслуговувати кілька з’єднань обміну повідомленнями та агентів. Якщо вам потрібна сильніша ізоляція або резервування (наприклад, rescue bot), запускайте окремі Gateway з ізольованими профілями/портами.

## Найкраща рекомендована конфігурація

Для більшості користувачів найпростіша конфігурація rescue bot така:

- тримати основного бота на типовому профілі
- запускати rescue bot на `--profile rescue`
- використовувати повністю окремого Telegram-бота для rescue-акаунта
- тримати rescue bot на іншому базовому порту, наприклад `19789`

Це тримає rescue bot ізольованим від основного бота, щоб він міг налагоджувати або застосовувати
зміни конфігурації, якщо основний бот не працює. Залишайте щонайменше 20 портів між
базовими портами, щоб похідні порти browser/canvas/CDP ніколи не конфліктували.

## Швидкий старт rescue bot

Використовуйте це як типовий шлях, якщо у вас немає вагомої причини робити щось
інакше:

```bash
# Rescue bot (окремий Telegram-бот, окремий профіль, порт 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Якщо ваш основний бот уже запущений, зазвичай це все, що вам потрібно.

Під час `openclaw --profile rescue onboard`:

- використовуйте окремий токен Telegram-бота
- залишайте профіль `rescue`
- використовуйте базовий порт щонайменше на 20 більший, ніж у основного бота
- прийміть типову робочу область rescue, якщо ви ще не керуєте власною

Якщо onboarding уже встановив для вас сервіс rescue, фінальний
`gateway install` не потрібен.

## Чому це працює

Rescue bot залишається незалежним, тому що має власні:

- профіль/конфігурацію
- каталог стану
- робочу область
- базовий порт (разом із похідними портами)
- токен Telegram-бота

Для більшості конфігурацій використовуйте повністю окремого Telegram-бота для профілю rescue:

- легко обмежити лише для оператора
- окремий токен та ідентичність бота
- незалежність від інсталяції каналу/застосунку основного бота
- простий шлях відновлення через DM, коли основний бот зламаний

## Що змінює `--profile rescue onboard`

`openclaw --profile rescue onboard` використовує звичайний потік onboarding, але
записує все в окремий профіль.

На практиці це означає, що rescue bot отримує власні:

- файл конфігурації
- каталог стану
- робочу область (типово `~/.openclaw/workspace-rescue`)
- назву керованого сервісу

В іншому запити такі самі, як і для звичайного onboarding.

## Загальна конфігурація з кількома Gateway

Наведене вище компонування rescue bot — найпростіший типовий варіант, але той самий шаблон
ізоляції працює для будь-якої пари або групи Gateway на одному хості.

Для загальнішої конфігурації надайте кожному додатковому Gateway власний іменований профіль і
власний базовий порт:

```bash
# main (типовий профіль)
openclaw setup
openclaw gateway --port 18789

# додатковий gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Якщо ви хочете, щоб обидва Gateway використовували іменовані профілі, це теж працює:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Сервіси дотримуються того самого шаблону:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Використовуйте швидкий старт rescue bot, коли вам потрібен резервний операторський шлях. Використовуйте
загальний шаблон профілів, коли вам потрібні кілька довготривалих Gateway для
різних каналів, орендарів, робочих областей або операційних ролей.

## Контрольний список ізоляції

Зберігайте унікальними для кожного екземпляра Gateway:

- `OPENCLAW_CONFIG_PATH` — файл конфігурації для кожного екземпляра
- `OPENCLAW_STATE_DIR` — сесії, облікові дані, кеші для кожного екземпляра
- `agents.defaults.workspace` — корінь робочої області для кожного екземпляра
- `gateway.port` (або `--port`) — унікальний для кожного екземпляра
- похідні порти browser/canvas/CDP

Якщо вони спільні, ви отримаєте гонки конфігурації та конфлікти портів.

## Відображення портів (похідне)

Базовий порт = `gateway.port` (або `OPENCLAW_GATEWAY_PORT` / `--port`).

- порт сервісу керування browser = база + 2 (лише loopback)
- хост canvas обслуговується на HTTP-сервері Gateway (той самий порт, що й `gateway.port`)
- порти CDP профілю Browser автоматично виділяються з діапазону `browser.controlPort + 9 .. + 108`

Якщо ви перевизначаєте будь-що з цього в конфігурації або env, ви повинні зберігати унікальність для кожного екземпляра.

## Примітки щодо Browser/CDP (типова пастка)

- **Не** фіксуйте `browser.cdpUrl` на однакових значеннях у кількох екземплярах.
- Кожному екземпляру потрібен власний порт керування browser і власний діапазон CDP (похідний від його порту gateway).
- Якщо вам потрібні явні порти CDP, встановлюйте `browser.profiles.<name>.cdpPort` для кожного екземпляра.
- Віддалений Chrome: використовуйте `browser.profiles.<name>.cdpUrl` (для кожного профілю, для кожного екземпляра).

## Приклад ручного env

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

- `gateway status --deep` допомагає виявити застарілі сервіси launchd/systemd/schtasks зі старіших інсталяцій.
- Попереджувальний текст `gateway probe`, наприклад `multiple reachable gateways detected`, очікуваний лише тоді, коли ви навмисно запускаєте більше ніж один ізольований gateway.

## Пов’язане

- [Посібник з Gateway](/uk/gateway)
- [Блокування Gateway](/uk/gateway/gateway-lock)
- [Конфігурація](/uk/gateway/configuration)
