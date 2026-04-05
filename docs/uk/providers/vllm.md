---
read_when:
    - Ви хочете запускати OpenClaw проти локального сервера vLLM
    - Ви хочете сумісні з OpenAI endpoint `/v1` зі своїми власними моделями
summary: Запуск OpenClaw із vLLM (локальний сервер, сумісний з OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-05T18:15:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebde34d0453586d10340680b8d51465fdc98bd28e8a96acfaeb24606886b50f4
    source_path: providers/vllm.md
    workflow: 15
---

# vLLM

vLLM може обслуговувати моделі з відкритим кодом (і деякі користувацькі моделі) через **HTTP API, сумісний з OpenAI**. OpenClaw може підключатися до vLLM за допомогою API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі з vLLM, якщо ви явно погодилися на це через `VLLM_API_KEY` (підійде будь-яке значення, якщо ваш сервер не вимагає auth) і не визначили явний запис `models.providers.vllm`.

## Швидкий початок

1. Запустіть vLLM із сервером, сумісним з OpenAI.

Ваша base URL має надавати endpoint `/v1` (наприклад `/v1/models`, `/v1/chat/completions`). vLLM часто працює за адресою:

- `http://127.0.0.1:8000/v1`

2. Увімкніть це (підійде будь-яке значення, якщо auth не налаштовано):

```bash
export VLLM_API_KEY="vllm-local"
```

3. Виберіть модель (замініть на один з ідентифікаторів моделей вашого vLLM):

```json5
{
  agents: {
    defaults: {
      model: { primary: "vllm/your-model-id" },
    },
  },
}
```

## Виявлення моделей (неявний провайдер)

Коли задано `VLLM_API_KEY` (або існує профіль auth) і ви **не** визначили `models.providers.vllm`, OpenClaw виконає запит:

- `GET http://127.0.0.1:8000/v1/models`

…і перетворить повернені ID на записи моделей.

Якщо ви явно задасте `models.providers.vllm`, автовиявлення буде пропущено, і вам доведеться визначати моделі вручну.

## Явна конфігурація (ручне визначення моделей)

Використовуйте явну конфігурацію, коли:

- vLLM працює на іншому хості/порту.
- Ви хочете зафіксувати значення `contextWindow`/`maxTokens`.
- Ваш сервер вимагає справжній API-ключ (або ви хочете керувати заголовками).

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

## Усунення неполадок

- Перевірте, що сервер доступний:

```bash
curl http://127.0.0.1:8000/v1/models
```

- Якщо запити завершуються помилками auth, задайте справжній `VLLM_API_KEY`, який відповідає конфігурації вашого сервера, або явно налаштуйте провайдера в `models.providers.vllm`.

## Поведінка в стилі проксі

vLLM розглядається як backend `/v1`, сумісний з OpenAI, у стилі проксі, а не як нативний endpoint OpenAI.

- нативне формування запитів лише для OpenAI тут не застосовується
- немає `service_tier`, немає `store` для Responses, немає підказок для prompt-cache і немає формування payload для сумісності reasoning OpenAI
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`) не додаються до користувацьких base URL vLLM
