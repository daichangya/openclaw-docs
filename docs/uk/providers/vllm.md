---
read_when:
    - Ви хочете запустити OpenClaw на локальному сервері vLLM
    - Ви хочете OpenAI-сумісні кінцеві точки `/v1` із власними моделями
summary: Запустіть OpenClaw з vLLM (сумісним із OpenAI локальним сервером)
title: vLLM
x-i18n:
    generated_at: "2026-04-26T03:02:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf424cb532f2b3e188c39545b187e5db6274ff2fadc01c9e4cb0901dbe9824c
    source_path: providers/vllm.md
    workflow: 15
---

vLLM може обслуговувати моделі з відкритим кодом (і деякі користувацькі) через **сумісний із OpenAI** HTTP API. OpenClaw підключається до vLLM за допомогою API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі з vLLM, якщо ви явно погоджуєтеся на це за допомогою `VLLM_API_KEY` (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації) і не визначаєте явний запис `models.providers.vllm`.

OpenClaw розглядає `vllm` як локального сумісного з OpenAI провайдера, який підтримує
облік використання під час потокової передачі, тому кількість токенів статусу/контексту може оновлюватися з
відповідей `stream_options.include_usage`.

| Властивість     | Значення                                 |
| ---------------- | ---------------------------------------- |
| ID провайдера    | `vllm`                                   |
| API              | `openai-completions` (сумісний із OpenAI) |
| Автентифікація   | змінна середовища `VLLM_API_KEY`         |
| Базовий URL за замовчуванням | `http://127.0.0.1:8000/v1`               |

## Початок роботи

<Steps>
  <Step title="Запустіть vLLM із сервером, сумісним із OpenAI">
    Ваш базовий URL має надавати кінцеві точки `/v1` (наприклад, `/v1/models`, `/v1/chat/completions`). vLLM зазвичай працює на:

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
    Замініть на один з ID моделей вашого vLLM:

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
  <Step title="Переконайтеся, що модель доступна">
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

і перетворює повернені ID на записи моделей.

<Note>
Якщо ви явно задаєте `models.providers.vllm`, автовиявлення пропускається, і вам потрібно визначити моделі вручну.
</Note>

## Явна конфігурація (моделі вручну)

Використовуйте явну конфігурацію, коли:

- vLLM працює на іншому хості або порту
- Ви хочете зафіксувати значення `contextWindow` або `maxTokens`
- Ваш сервер вимагає справжній API-ключ (або ви хочете керувати заголовками)
- Ви підключаєтеся до довіреної кінцевої точки vLLM через local loopback, LAN або Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        models: [
          {
            id: "your-model-id",
            name: "Локальна модель vLLM",
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
  <Accordion title="Поведінка у стилі проксі">
    vLLM розглядається як бекенд `/v1`, сумісний із OpenAI, у стилі проксі, а не як нативна
    кінцева точка OpenAI. Це означає:

    | Поведінка | Застосовується? |
    |----------|----------|
    | Нативне формування запитів OpenAI | Ні |
    | `service_tier` | Не надсилається |
    | `store` у відповідях | Не надсилається |
    | Підказки кешу промптів | Не надсилаються |
    | Формування payload для сумісності OpenAI reasoning | Не застосовується |
    | Приховані заголовки атрибуції OpenClaw | Не додаються до користувацьких базових URL |

  </Accordion>

  <Accordion title="Елементи керування thinking у Nemotron 3">
    vLLM/Nemotron 3 може використовувати kwargs шаблону чату, щоб керувати тим, чи reasoning
    повертається як приховане reasoning або як видимий текст відповіді. Коли сеанс OpenClaw
    використовує `vllm/nemotron-3-*` із вимкненим thinking, OpenClaw надсилає:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Щоб налаштувати ці значення, задайте `chat_template_kwargs` у параметрах моделі.
    Якщо ви також задаєте `params.extra_body.chat_template_kwargs`, це значення має
    остаточний пріоритет, оскільки `extra_body` є останнім перевизначенням тіла запиту.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Користувацький базовий URL">
    Якщо ваш сервер vLLM працює на нестандартному хості або порту, задайте `baseUrl` у явній конфігурації провайдера:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            models: [
              {
                id: "my-custom-model",
                name: "Віддалена модель vLLM",
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

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Сервер недоступний">
    Перевірте, чи сервер vLLM запущений і доступний:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Якщо ви бачите помилку з’єднання, перевірте хост, порт і переконайтеся, що vLLM запущено в режимі сервера, сумісного з OpenAI.
    Для явних кінцевих точок loopback, LAN або Tailscale також задайте
    `models.providers.vllm.request.allowPrivateNetwork: true`; запити провайдера
    типово блокують URL приватної мережі, якщо провайдер не позначено
    як явно довірений.

  </Accordion>

  <Accordion title="Помилки автентифікації у запитах">
    Якщо запити завершуються помилками автентифікації, задайте справжній `VLLM_API_KEY`, який відповідає конфігурації вашого сервера, або налаштуйте провайдера явно в `models.providers.vllm`.

    <Tip>
    Якщо ваш сервер vLLM не вимагає автентифікації, будь-яке непорожнє значення `VLLM_API_KEY` працює як сигнал явної згоди для OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Моделі не виявлено">
    Для автовиявлення потрібно, щоб `VLLM_API_KEY` було встановлено **і** щоб не було явного запису конфігурації `models.providers.vllm`. Якщо ви визначили провайдера вручну, OpenClaw пропускає виявлення і використовує лише оголошені вами моделі.
  </Accordion>
</AccordionGroup>

<Warning>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання при відмові.
  </Card>
  <Card title="OpenAI" href="/uk/providers/openai" icon="bolt">
    Нативний провайдер OpenAI і поведінка маршрутів, сумісних із OpenAI.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Деталі автентифікації та правила повторного використання облікових даних.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх вирішення.
  </Card>
</CardGroup>
