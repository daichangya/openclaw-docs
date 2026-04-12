---
read_when:
    - Ви хочете запустити OpenClaw із локальним сервером SGLang
    - Ви хочете OpenAI-сумісні ендпоїнти `/v1` із власними моделями
summary: Запустіть OpenClaw із SGLang (самостійно розміщений сервер, сумісний з OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-12T10:22:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: e0a2e50a499c3d25dcdc3af425fb023c6e3f19ed88f533ecf0eb8a2cb7ec8b0d
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang може обслуговувати моделі з відкритим кодом через **OpenAI-сумісний** HTTP API.
OpenClaw може підключатися до SGLang за допомогою API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі із SGLang, якщо ви
увімкнете це за допомогою `SGLANG_API_KEY` (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації)
і не визначите явний запис `models.providers.sglang`.

## Початок роботи

<Steps>
  <Step title="Запустіть SGLang">
    Запустіть SGLang із сервером, сумісним з OpenAI. Ваш базовий URL має надавати
    ендпоїнти `/v1` (наприклад, `/v1/models`, `/v1/chat/completions`). SGLang зазвичай працює на:

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="Установіть API-ключ">
    Підійде будь-яке значення, якщо на вашому сервері не налаштовано автентифікацію:

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="Запустіть онбординг або встановіть модель безпосередньо">
    ```bash
    openclaw onboard
    ```

    Або налаштуйте модель вручну:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Виявлення моделей (неявний провайдер)

Коли `SGLANG_API_KEY` встановлено (або існує профіль автентифікації) і ви **не**
визначаєте `models.providers.sglang`, OpenClaw виконає запит до:

- `GET http://127.0.0.1:30000/v1/models`

і перетворить повернуті ідентифікатори на записи моделей.

<Note>
Якщо ви явно задаєте `models.providers.sglang`, автоматичне виявлення пропускається, і
ви повинні визначити моделі вручну.
</Note>

## Явна конфігурація (ручне задання моделей)

Використовуйте явну конфігурацію, якщо:

- SGLang працює на іншому хості/порту.
- Ви хочете зафіксувати значення `contextWindow`/`maxTokens`.
- Ваш сервер вимагає справжній API-ключ (або ви хочете керувати заголовками).

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Локальна модель SGLang",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Поведінка в стилі проксі">
    SGLang розглядається як OpenAI-сумісний бекенд `/v1` у стилі проксі, а не як
    нативний ендпоїнт OpenAI.

    | Поведінка | SGLang |
    |----------|--------|
    | Формування запиту лише для OpenAI | Не застосовується |
    | `service_tier`, Responses `store`, підказки кешу промптів | Не надсилаються |
    | Формування payload для сумісності reasoning | Не застосовується |
    | Приховані заголовки атрибуції (`originator`, `version`, `User-Agent`) | Не додаються для користувацьких базових URL SGLang |

  </Accordion>

  <Accordion title="Усунення несправностей">
    **Сервер недоступний**

    Переконайтеся, що сервер запущено і він відповідає:

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **Помилки автентифікації**

    Якщо запити завершуються помилками автентифікації, установіть справжній `SGLANG_API_KEY`, який відповідає
    конфігурації вашого сервера, або явно налаштуйте провайдера в
    `models.providers.sglang`.

    <Tip>
    Якщо ви запускаєте SGLang без автентифікації, будь-якого непорожнього значення для
    `SGLANG_API_KEY` достатньо, щоб увімкнути виявлення моделей.
    </Tip>

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації, включно із записами провайдерів.
  </Card>
</CardGroup>
