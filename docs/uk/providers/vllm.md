---
read_when:
    - Ви хочете запустити OpenClaw з локальним сервером vLLM
    - Ви хочете використовувати сумісні з OpenAI ендпойнти `/v1` із власними моделями
summary: Запустіть OpenClaw з vLLM (локальним сервером, сумісним з OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-27T04:34:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 60d82c078af1e7565900eab879d30fe4e6c6ee4f3733df6f19d5f30d5cbd0b59
    source_path: providers/vllm.md
    workflow: 15
---

vLLM може обслуговувати моделі з відкритим кодом (і деякі користувацькі) через **OpenAI-сумісний** HTTP API. OpenClaw підключається до vLLM за допомогою API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі з vLLM, якщо ви явно вмикаєте це через `VLLM_API_KEY` (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації) і не визначаєте явний запис `models.providers.vllm`.

OpenClaw розглядає `vllm` як локального OpenAI-сумісного провайдера, який підтримує
облік використання під час потокової передачі, тому кількість токенів у статусі/контексті може оновлюватися з
відповідей `stream_options.include_usage`.

| Властивість      | Значення                                 |
| ---------------- | ---------------------------------------- |
| ID провайдера    | `vllm`                                   |
| API              | `openai-completions` (OpenAI-сумісний)   |
| Автентифікація   | змінна середовища `VLLM_API_KEY`         |
| Базова URL за замовчуванням | `http://127.0.0.1:8000/v1`     |

## Початок роботи

<Steps>
  <Step title="Запустіть vLLM з OpenAI-сумісним сервером">
    Ваша базова URL має надавати ендпойнти `/v1` (наприклад, `/v1/models`, `/v1/chat/completions`). vLLM зазвичай працює на:

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
    Замініть на один із ваших ID моделей vLLM:

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

Коли `VLLM_API_KEY` установлено (або існує профіль автентифікації) і ви **не** визначили `models.providers.vllm`, OpenClaw виконує запит:

```
GET http://127.0.0.1:8000/v1/models
```

і перетворює повернені ID на записи моделей.

<Note>
Якщо ви явно задаєте `models.providers.vllm`, автоматичне виявлення пропускається, і ви маєте визначити моделі вручну.
</Note>

## Явна конфігурація (ручне визначення моделей)

Використовуйте явну конфігурацію, коли:

- vLLM працює на іншому хості або порту
- ви хочете зафіксувати значення `contextWindow` або `maxTokens`
- ваш сервер вимагає справжній API-ключ (або ви хочете керувати заголовками)
- ви підключаєтеся до довіреного ендпойнта vLLM через local loopback, LAN або Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Необов’язково: збільшує тайм-аут підключення/заголовків/тіла/запиту для повільних локальних моделей
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
    | Приховані заголовки атрибуції OpenClaw | Не додаються для користувацьких базових URL |

  </Accordion>

  <Accordion title="Керування thinking у Nemotron 3">
    vLLM/Nemotron 3 може використовувати kwargs шаблону чату, щоб керувати тим, чи reasoning
    повертається як прихований reasoning або як видимий текст відповіді. Коли сеанс OpenClaw
    використовує `vllm/nemotron-3-*` з вимкненим thinking, OpenClaw надсилає:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Щоб налаштувати ці значення, задайте `chat_template_kwargs` у параметрах моделі.
    Якщо ви також задасте `params.extra_body.chat_template_kwargs`, це значення матиме
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

  <Accordion title="Користувацька базова URL">
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
            timeoutSeconds: 300,
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
  <Accordion title="Повільна перша відповідь або тайм-аут віддаленого сервера">
    Для великих локальних моделей, віддалених хостів у LAN або каналів tailnet задайте
    тайм-аут запиту в межах провайдера:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Локальна модель vLLM" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` застосовується лише до HTTP-запитів до моделей vLLM, включно з
    установленням з’єднання, заголовками відповіді, потоковою передачею тіла та загальним
    перериванням guarded-fetch. Надавайте цьому перевагу перед збільшенням
    `agents.defaults.timeoutSeconds`, який керує всім запуском агента.

  </Accordion>

  <Accordion title="Сервер недоступний">
    Переконайтеся, що сервер vLLM запущено й до нього можна звернутися:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Якщо ви бачите помилку з’єднання, перевірте хост, порт і те, що vLLM запущено в режимі OpenAI-сумісного сервера.
    Для явних ендпойнтів local loopback, LAN або Tailscale також задайте
    `models.providers.vllm.request.allowPrivateNetwork: true`; запити провайдера
    за замовчуванням блокують URL приватної мережі, якщо провайдер не
    позначено як явно довірений.

  </Accordion>

  <Accordion title="Помилки автентифікації в запитах">
    Якщо запити завершуються помилками автентифікації, задайте справжній `VLLM_API_KEY`, що відповідає конфігурації вашого сервера, або явно налаштуйте провайдера в `models.providers.vllm`.

    <Tip>
    Якщо ваш сервер vLLM не вимагає автентифікації, будь-яке непорожнє значення `VLLM_API_KEY` працює як сигнал явного ввімкнення для OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Моделі не виявлено">
    Автоматичне виявлення вимагає, щоб `VLLM_API_KEY` було встановлено **і** щоб не було явного запису конфігурації `models.providers.vllm`. Якщо ви визначили провайдера вручну, OpenClaw пропускає виявлення й використовує лише оголошені вами моделі.
  </Accordion>
</AccordionGroup>

<Warning>
Більше довідки: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання на резервний варіант.
  </Card>
  <Card title="OpenAI" href="/uk/providers/openai" icon="bolt">
    Нативний провайдер OpenAI та поведінка OpenAI-сумісного маршруту.
  </Card>
  <Card title="OAuth та автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Типові проблеми та способи їх вирішення.
  </Card>
</CardGroup>
