---
read_when:
    - Налаштування OpenClaw на Hostinger
    - Пошук керованого VPS для OpenClaw
    - Використання Hostinger 1-Click OpenClaw
summary: Розмістіть OpenClaw на Hostinger
title: Hostinger
x-i18n:
    generated_at: "2026-04-23T06:44:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ee70d24fd1c3a6de503fc967d7e726d701f84cc6717fe7a3bc65a6a28e386ea
    source_path: install/hostinger.md
    workflow: 15
---

# Hostinger

Запустіть постійний Gateway OpenClaw на [Hostinger](https://www.hostinger.com/openclaw) через кероване розгортання **1-Click** або встановлення на **VPS**.

## Передумови

- Обліковий запис Hostinger ([signup](https://www.hostinger.com/openclaw))
- Близько 5–10 хвилин

## Варіант A: 1-Click OpenClaw

Найшвидший спосіб почати. Hostinger бере на себе інфраструктуру, Docker і автоматичні оновлення.

<Steps>
  <Step title="Purchase and launch">
    1. На сторінці [Hostinger OpenClaw](https://www.hostinger.com/openclaw) виберіть тариф Managed OpenClaw і завершіть оформлення замовлення.

    <Note>
    Під час оформлення замовлення ви можете вибрати кредити **Ready-to-Use AI**, які попередньо придбані та миттєво інтегруються в OpenClaw — не потрібні зовнішні облікові записи або API keys від інших провайдерів. Ви можете одразу почати спілкування. Або ж під час налаштування вкажіть власний ключ від Anthropic, OpenAI, Google Gemini або xAI.
    </Note>

  </Step>

  <Step title="Select a messaging channel">
    Виберіть один або кілька каналів для підключення:

    - **WhatsApp** — відскануйте QR-код, показаний у майстрі налаштування.
    - **Telegram** — вставте токен бота з [BotFather](https://t.me/BotFather).

  </Step>

  <Step title="Complete installation">
    Натисніть **Finish**, щоб розгорнути екземпляр. Коли все буде готово, відкрийте панель керування OpenClaw з **OpenClaw Overview** у hPanel.
  </Step>

</Steps>

## Варіант B: OpenClaw на VPS

Більше контролю над сервером. Hostinger розгортає OpenClaw через Docker на вашому VPS, а ви керуєте ним через **Docker Manager** у hPanel.

<Steps>
  <Step title="Purchase a VPS">
    1. На сторінці [Hostinger OpenClaw](https://www.hostinger.com/openclaw) виберіть тариф OpenClaw on VPS і завершіть оформлення замовлення.

    <Note>
    Під час оформлення замовлення ви можете вибрати кредити **Ready-to-Use AI** — вони попередньо придбані та миттєво інтегруються в OpenClaw, тож ви можете почати спілкування без будь-яких зовнішніх облікових записів або API keys від інших провайдерів.
    </Note>

  </Step>

  <Step title="Configure OpenClaw">
    Коли VPS буде підготовлено, заповніть поля конфігурації:

    - **Gateway token** — генерується автоматично; збережіть його для подальшого використання.
    - **WhatsApp number** — ваш номер із кодом країни (необов’язково).
    - **Telegram bot token** — з [BotFather](https://t.me/BotFather) (необов’язково).
    - **API keys** — потрібні лише якщо ви не вибрали кредити Ready-to-Use AI під час оформлення замовлення.

  </Step>

  <Step title="Start OpenClaw">
    Натисніть **Deploy**. Після запуску відкрийте панель керування OpenClaw у hPanel, натиснувши **Open**.
  </Step>

</Steps>

Журнали, перезапуски та оновлення керуються безпосередньо через інтерфейс Docker Manager у hPanel. Щоб оновити, натисніть **Update** у Docker Manager, і буде завантажено найновіший образ.

## Перевірка налаштування

Надішліть «Hi» своєму асистенту в підключеному каналі. OpenClaw відповість і проведе вас через початкові налаштування.

## Усунення несправностей

**Панель керування не завантажується** — зачекайте кілька хвилин, поки контейнер завершить підготовку. Перевірте журнали Docker Manager у hPanel.

**Docker-контейнер постійно перезапускається** — відкрийте журнали Docker Manager і перевірте наявність помилок конфігурації (відсутні токени, недійсні API keys).

**Бот Telegram не відповідає** — надішліть повідомлення з кодом pairing з Telegram безпосередньо як повідомлення у вашому чаті OpenClaw, щоб завершити підключення.

## Наступні кроки

- [Channels](/uk/channels) — підключення Telegram, WhatsApp, Discord тощо
- [Gateway configuration](/uk/gateway/configuration) — усі параметри конфігурації
