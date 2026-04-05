---
read_when:
    - Ви хочете запускати OpenClaw проти локального сервера SGLang
    - Ви хочете сумісні з OpenAI endpoint `/v1` зі своїми власними моделями
summary: Запуск OpenClaw із SGLang (self-hosted сервер, сумісний з OpenAI)
title: SGLang
x-i18n:
    generated_at: "2026-04-05T18:14:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9850277c6c5e318e60237688b4d8a5b1387d4e9586534ae2eb6ad953abba8948
    source_path: providers/sglang.md
    workflow: 15
---

# SGLang

SGLang може обслуговувати моделі з відкритим кодом через **HTTP API, сумісний з OpenAI**.
OpenClaw може підключатися до SGLang за допомогою API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі з SGLang, якщо ви
явно погодилися на це через `SGLANG_API_KEY` (підійде будь-яке значення, якщо ваш сервер не вимагає auth)
і не визначили явний запис `models.providers.sglang`.

## Швидкий початок

1. Запустіть SGLang із сервером, сумісним з OpenAI.

Ваша base URL має надавати endpoint `/v1` (наприклад `/v1/models`,
`/v1/chat/completions`). SGLang часто працює за адресою:

- `http://127.0.0.1:30000/v1`

2. Увімкніть це (підійде будь-яке значення, якщо auth не налаштовано):

```bash
export SGLANG_API_KEY="sglang-local"
```

3. Запустіть onboarding і виберіть `SGLang`, або задайте модель напряму:

```bash
openclaw onboard
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "sglang/your-model-id" },
    },
  },
}
```

## Виявлення моделей (неявний провайдер)

Коли задано `SGLANG_API_KEY` (або існує профіль auth) і ви **не**
визначили `models.providers.sglang`, OpenClaw виконає запит:

- `GET http://127.0.0.1:30000/v1/models`

і перетворить повернені ID на записи моделей.

Якщо ви явно задасте `models.providers.sglang`, автовиявлення буде пропущено, і
вам доведеться визначати моделі вручну.

## Явна конфігурація (ручне визначення моделей)

Використовуйте явну конфігурацію, коли:

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

## Усунення неполадок

- Перевірте, що сервер доступний:

```bash
curl http://127.0.0.1:30000/v1/models
```

- Якщо запити завершуються помилками auth, задайте справжній `SGLANG_API_KEY`, який відповідає
  конфігурації вашого сервера, або явно налаштуйте провайдера в
  `models.providers.sglang`.

## Поведінка в стилі проксі

SGLang розглядається як backend `/v1`, сумісний з OpenAI, у стилі проксі, а не як
нативний endpoint OpenAI.

- нативне формування запитів лише для OpenAI тут не застосовується
- немає `service_tier`, немає `store` для Responses, немає підказок для prompt-cache і немає
  формування payload для сумісності reasoning OpenAI
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються до користувацьких base URL SGLang
