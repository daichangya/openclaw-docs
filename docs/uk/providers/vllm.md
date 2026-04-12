---
read_when:
    - Ви хочете запустити OpenClaw із локальним сервером vLLM
    - Ви хочете OpenAI-сумісні ендпойнти `/v1` із власними моделями
summary: Запустіть OpenClaw із vLLM (сумісний із OpenAI локальний сервер)
title: vLLM
x-i18n:
    generated_at: "2026-04-12T10:22:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: a43be9ae879158fcd69d50fb3a47616fd560e3c6fe4ecb3a109bdda6a63a6a80
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM може обслуговувати open-source (і деякі кастомні) моделі через **OpenAI-сумісний** HTTP API. OpenClaw підключається до vLLM за допомогою API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі з vLLM, коли ви явно вмикаєте це за допомогою `VLLM_API_KEY` (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації) і не визначаєте явний запис `models.providers.vllm`.

| Властивість      | Значення                                 |
| ---------------- | ---------------------------------------- |
| ID провайдера    | `vllm`                                   |
| API              | `openai-completions` (OpenAI-сумісний)   |
| Автентифікація   | змінна середовища `VLLM_API_KEY`         |
| Базовий URL за замовчуванням | `http://127.0.0.1:8000/v1`     |

## Початок роботи

<Steps>
  <Step title="Запустіть vLLM з OpenAI-сумісним сервером">
    Ваш базовий URL має надавати ендпойнти `/v1` (наприклад, `/v1/models`, `/v1/chat/completions`). vLLM зазвичай працює на:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Установіть змінну середовища для API-ключа">
    Підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Виберіть модель">
    Замініть на один із ID моделей вашого vLLM:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Виявлення моделей (неявний провайдер)

Коли `VLLM_API_KEY` встановлено (або існує профіль автентифікації) і ви **не** визначаєте `models.providers.vllm`, OpenClaw виконує запит:

```
GET http://127.0.0.1:8000/v1/models
```

і перетворює повернуті ID на записи моделей.

<Note>
Якщо ви явно задаєте `models.providers.vllm`, автоматичне виявлення пропускається, і вам потрібно визначити моделі вручну.
</Note>

## Явна конфігурація (моделі вручну)

Використовуйте явну конфігурацію, коли:

- vLLM працює на іншому хості або порту
- Ви хочете зафіксувати значення `contextWindow` або `maxTokens`
- Ваш сервер вимагає справжній API-ключ (або ви хочете керувати заголовками)

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
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

## Додаткові примітки

<AccordionGroup>
  <Accordion title="Поведінка в стилі проксі">
    vLLM розглядається як OpenAI-сумісний бекенд `/v1` у стилі проксі, а не як нативний
    ендпойнт OpenAI. Це означає:

    | Поведінка | Застосовується? |
    |----------|----------|
    | Нативне формування запитів OpenAI | Ні |
    | `service_tier` | Не надсилається |
    | Відповіді `store` | Не надсилаються |
    | Підказки кешу промптів | Не надсилаються |
    | Формування payload для сумісності з reasoning OpenAI | Не застосовується |
    | Приховані заголовки атрибуції OpenClaw | Не додаються в кастомні базові URL |

  </Accordion>

  <Accordion title="Кастомний базовий URL">
    Якщо ваш сервер vLLM працює на нестандартному хості або порту, установіть `baseUrl` у явній конфігурації провайдера:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Усунення неполадок

<AccordionGroup>
  <Accordion title="Сервер недоступний">
    Переконайтеся, що сервер vLLM запущений і доступний:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Якщо ви бачите помилку з’єднання, перевірте хост, порт і те, що vLLM запущено в режимі OpenAI-сумісного сервера.

  </Accordion>

  <Accordion title="Помилки автентифікації в запитах">
    Якщо запити завершуються помилками автентифікації, установіть справжній `VLLM_API_KEY`, який відповідає конфігурації вашого сервера, або явно налаштуйте провайдера в `models.providers.vllm`.

    <Tip>
    Якщо ваш сервер vLLM не вимагає автентифікації, будь-яке непорожнє значення `VLLM_API_KEY` працює як сигнал явного ввімкнення для OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Моделі не виявлено">
    Для автоматичного виявлення потрібно, щоб `VLLM_API_KEY` було встановлено **і** не було явного запису конфігурації `models.providers.vllm`. Якщо ви визначили провайдера вручну, OpenClaw пропускає виявлення й використовує лише оголошені вами моделі.
  </Accordion>
</AccordionGroup>

<Warning>
Більше допомоги: [Усунення неполадок](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="OpenAI" href="/uk/providers/openai" icon="bolt">
    Нативний провайдер OpenAI і поведінка OpenAI-сумісного маршруту.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Деталі автентифікації та правила повторного використання облікових даних.
  </Card>
  <Card title="Усунення неполадок" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх вирішення.
  </Card>
</CardGroup>
