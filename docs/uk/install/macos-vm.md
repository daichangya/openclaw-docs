---
read_when:
    - Ви хочете ізолювати OpenClaw від свого основного середовища macOS
    - Ви хочете інтеграцію з iMessage (BlueBubbles) у sandbox
    - Ви хочете середовище macOS, яке можна скидати й клонувати
    - Ви хочете порівняти локальні й хмарні варіанти macOS VM
summary: Запускайте OpenClaw в ізольованій macOS VM (локально або у хмарі), коли вам потрібна ізоляція або iMessage
title: macOS VM
x-i18n:
    generated_at: "2026-04-05T18:08:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: b1f7c5691fd2686418ee25f2c38b1f9badd511daeef2906d21ad30fb523b013f
    source_path: install/macos-vm.md
    workflow: 15
---

# OpenClaw на macOS VM (sandboxing)

## Рекомендований варіант за замовчуванням (для більшості користувачів)

- **Невеликий Linux VPS** для постійно ввімкненого Gateway і низької вартості. Див. [Розміщення на VPS](/vps).
- **Виділене обладнання** (Mac mini або Linux-машина), якщо вам потрібен повний контроль і **резидентна IP-адреса** для автоматизації браузера. Багато сайтів блокують IP-адреси дата-центрів, тому локальний браузинг часто працює краще.
- **Гібрид:** залиште Gateway на недорогому VPS, а свій Mac підключайте як **вузол**, коли вам потрібна автоматизація браузера/UI. Див. [Вузли](/nodes) і [Віддалений Gateway](/gateway/remote).

Використовуйте macOS VM, коли вам конкретно потрібні можливості лише для macOS (iMessage/BlueBubbles) або коли ви хочете сувору ізоляцію від свого повсякденного Mac.

## Варіанти macOS VM

### Локальна VM на вашому Mac з Apple Silicon (Lume)

Запускайте OpenClaw в ізольованій macOS VM на вашому наявному Mac з Apple Silicon за допомогою [Lume](https://cua.ai/docs/lume).

Це дає вам:

- Повноцінне середовище macOS в ізоляції (ваш хост залишається чистим)
- Підтримку iMessage через BlueBubbles (неможливо на Linux/Windows)
- Миттєве скидання через клонування VM
- Без додаткового обладнання чи хмарних витрат

### Хмарні провайдери Mac

Якщо ви хочете macOS у хмарі, хмарні провайдери Mac також підходять:

- [MacStadium](https://www.macstadium.com/) (хмарні Mac)
- Інші постачальники хмарних Mac також працюють; дотримуйтеся їхньої документації щодо VM + SSH

Щойно ви отримаєте SSH-доступ до macOS VM, переходьте до кроку 6 нижче.

---

## Швидкий шлях (Lume, для досвідчених користувачів)

1. Установіть Lume
2. `lume create openclaw --os macos --ipsw latest`
3. Завершіть Setup Assistant, увімкніть Remote Login (SSH)
4. `lume run openclaw --no-display`
5. Підключіться через SSH, установіть OpenClaw, налаштуйте канали
6. Готово

---

## Що вам потрібно (Lume)

- Mac з Apple Silicon (M1/M2/M3/M4)
- macOS Sequoia або новіша на хості
- ~60 ГБ вільного місця на диску на кожну VM
- ~20 хвилин

---

## 1) Установіть Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

Якщо `~/.local/bin` не входить до вашого PATH:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

Перевірка:

```bash
lume --version
```

Документація: [Установлення Lume](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) Створіть macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

Це завантажить macOS і створить VM. Вікно VNC відкриється автоматично.

Примітка: залежно від вашого з’єднання завантаження може тривати певний час.

---

## 3) Завершіть Setup Assistant

У вікні VNC:

1. Виберіть мову та регіон
2. Пропустіть Apple ID (або ввійдіть, якщо пізніше хочете iMessage)
3. Створіть обліковий запис користувача (запам’ятайте ім’я користувача і пароль)
4. Пропустіть усі необов’язкові можливості

Після завершення налаштування увімкніть SSH:

1. Відкрийте System Settings → General → Sharing
2. Увімкніть "Remote Login"

---

## 4) Отримайте IP-адресу VM

```bash
lume get openclaw
```

Знайдіть IP-адресу (зазвичай `192.168.64.x`).

---

## 5) Підключіться до VM через SSH

```bash
ssh youruser@192.168.64.X
```

Замініть `youruser` на створений вами обліковий запис, а IP — на IP вашої VM.

---

## 6) Установіть OpenClaw

Усередині VM:

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

Дотримуйтеся підказок onboarding, щоб налаштувати свого провайдера моделей (Anthropic, OpenAI тощо).

---

## 7) Налаштуйте канали

Відредагуйте файл конфігурації:

```bash
nano ~/.openclaw/openclaw.json
```

Додайте свої канали:

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

Потім увійдіть у WhatsApp (відскануйте QR):

```bash
openclaw channels login
```

---

## 8) Запустіть VM без інтерфейсу

Зупиніть VM і перезапустіть без відображення:

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM працює у фоновому режимі. Демон OpenClaw підтримує роботу gateway.

Щоб перевірити стан:

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## Бонус: інтеграція з iMessage

Це головна перевага запуску на macOS. Використовуйте [BlueBubbles](https://bluebubbles.app), щоб додати iMessage до OpenClaw.

Усередині VM:

1. Завантажте BlueBubbles з bluebubbles.app
2. Увійдіть за допомогою свого Apple ID
3. Увімкніть Web API і задайте пароль
4. Спрямуйте webhook BlueBubbles на свій gateway (приклад: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`)

Додайте до конфігурації OpenClaw:

```json5
{
  channels: {
    bluebubbles: {
      serverUrl: "http://localhost:1234",
      password: "your-api-password",
      webhookPath: "/bluebubbles-webhook",
    },
  },
}
```

Перезапустіть gateway. Тепер ваш агент зможе надсилати й отримувати iMessage.

Докладні налаштування: [Канал BlueBubbles](/channels/bluebubbles)

---

## Збережіть еталонний образ

Перш ніж продовжувати налаштування, створіть знімок чистого стану:

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

Скидання в будь-який час:

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## Робота 24/7

Щоб VM працювала постійно:

- Тримайте Mac підключеним до живлення
- Вимкніть режим сну в System Settings → Energy Saver
- За потреби використовуйте `caffeinate`

Для справді постійної роботи розгляньте виділений Mac mini або невеликий VPS. Див. [Розміщення на VPS](/vps).

---

## Усунення несправностей

| Проблема                 | Рішення                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Не вдається підключитися до VM через SSH | Переконайтеся, що в System Settings усередині VM увімкнено "Remote Login"         |
| IP-адреса VM не відображається | Дочекайтеся повного завантаження VM, потім знову виконайте `lume get openclaw`   |
| Команду Lume не знайдено | Додайте `~/.local/bin` до свого PATH                                              |
| QR WhatsApp не сканується | Переконайтеся, що ви ввійшли саме у VM (а не на хості), коли запускаєте `openclaw channels login` |

---

## Пов’язана документація

- [Розміщення на VPS](/vps)
- [Вузли](/nodes)
- [Віддалений Gateway](/gateway/remote)
- [Канал BlueBubbles](/channels/bluebubbles)
- [Швидкий старт Lume](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Довідник CLI Lume](https://cua.ai/docs/lume/reference/cli-reference)
- [Ненаглядне налаштування VM](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup) (додатково)
- [Docker Sandboxing](/install/docker) (альтернативний підхід до ізоляції)
