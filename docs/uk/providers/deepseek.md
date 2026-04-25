---
read_when:
    - Ви хочете використовувати DeepSeek з OpenClaw
    - Вам потрібна змінна середовища ключа API або вибір автентифікації в CLI
summary: Налаштування DeepSeek (автентифікація + вибір моделі)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T03:29:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) надає потужні AI-моделі з API, сумісним з OpenAI.

| Властивість | Значення                  |
| ----------- | ------------------------- |
| Провайдер   | `deepseek`                |
| Автентифікація | `DEEPSEEK_API_KEY`     |
| API         | сумісний з OpenAI         |
| Базовий URL | `https://api.deepseek.com` |

## Початок роботи

<Steps>
  <Step title="Отримайте свій API-ключ">
    Створіть API-ключ на [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Запустіть онбординг">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Це запросить ваш API-ключ і встановить `deepseek/deepseek-v4-flash` як модель за замовчуванням.

  </Step>
  <Step title="Переконайтеся, що моделі доступні">
    ```bash
    openclaw models list --provider deepseek
    ```

    Щоб переглянути вбудований статичний каталог без потреби в запущеному Gateway,
    використайте:

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Неінтерактивне налаштування">
    Для сценарних або безголових встановлень передайте всі прапорці безпосередньо:

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Якщо Gateway працює як демон (launchd/systemd), переконайтеся, що `DEEPSEEK_API_KEY`
доступний для цього процесу (наприклад, у `~/.openclaw/.env` або через
`env.shellEnv`).
</Warning>

## Вбудований каталог

| Посилання моделі             | Назва             | Вхід | Контекст  | Макс. вивід | Примітки                                   |
| ---------------------------- | ----------------- | ---- | --------- | ----------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text | 1,000,000 | 384,000     | Модель за замовчуванням; поверхня V4 з підтримкою thinking |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text | 1,000,000 | 384,000     | Поверхня V4 з підтримкою thinking          |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text | 131,072   | 8,192       | Поверхня DeepSeek V3.2 без thinking        |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text | 131,072   | 65,536      | Поверхня V3.2 з увімкненим міркуванням     |

<Tip>
Моделі V4 підтримують керування `thinking` від DeepSeek. OpenClaw також повторно відтворює
`reasoning_content` DeepSeek у наступних ходах, тож сесії thinking з викликами
інструментів можуть продовжуватися.
</Tip>

## Thinking та інструменти

Thinking-сесії DeepSeek V4 мають суворіший контракт повторного відтворення, ніж більшість
провайдерів, сумісних з OpenAI: коли повідомлення асистента з увімкненим thinking містить
виклики інструментів, DeepSeek очікує, що попередній `reasoning_content` асистента буде
надіслано назад у наступному запиті. OpenClaw обробляє це всередині Plugin DeepSeek,
тому звичайне багатокрокове використання інструментів працює з `deepseek/deepseek-v4-flash` і
`deepseek/deepseek-v4-pro`.

Якщо ви перемкнете наявну сесію з іншого провайдера, сумісного з OpenAI, на
модель DeepSeek V4, старіші ходи викликів інструментів асистента можуть не мати рідного
`reasoning_content` DeepSeek. OpenClaw заповнює це відсутнє поле для запитів thinking DeepSeek V4,
щоб провайдер міг прийняти повторно відтворену історію викликів інструментів
без потреби у `/new`.

Коли thinking вимкнено в OpenClaw (включно з вибором **None** в UI),
OpenClaw надсилає DeepSeek `thinking: { type: "disabled" }` і видаляє повторно відтворений
`reasoning_content` з вихідної історії. Це зберігає сесії з вимкненим thinking
на шляху DeepSeek без thinking.

Використовуйте `deepseek/deepseek-v4-flash` для стандартного швидкого шляху. Використовуйте
`deepseek/deepseek-v4-pro`, якщо вам потрібна потужніша модель V4 і ви можете прийняти
вищу вартість або затримку.

## Live testing

Набір прямих live-моделей включає DeepSeek V4 у сучасному наборі моделей. Щоб
запустити лише прямі перевірки моделей DeepSeek V4:

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Ця live-перевірка підтверджує, що обидві моделі V4 можуть завершувати роботу і що наступні
ходи thinking/інструментів зберігають корисне навантаження повторного відтворення, яке вимагає DeepSeek.

## Приклад конфігурації

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань моделей і поведінки перемикання на резервний варіант.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
