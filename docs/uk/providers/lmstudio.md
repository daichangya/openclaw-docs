---
read_when:
    - Ви хочете запускати OpenClaw з open source моделями через LM Studio
    - Ви хочете налаштувати й сконфігурувати LM Studio
summary: Запуск OpenClaw з LM Studio
title: LM Studio
x-i18n:
    generated_at: "2026-04-24T03:48:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2077790173a8cb660409b64e199d2027dda7b5b55226a00eadb0cdc45061e3ce
    source_path: providers/lmstudio.md
    workflow: 15
---

LM Studio — це зручний і водночас потужний застосунок для запуску моделей з відкритими вагами на власному обладнанні. Він дає змогу запускати моделі llama.cpp (GGUF) або MLX (Apple Silicon). Доступний як GUI-застосунок або безголовий демон (`llmster`). Документацію про продукт і налаштування див. на [lmstudio.ai](https://lmstudio.ai/).

## Швидкий старт

1. Установіть LM Studio (desktop) або `llmster` (headless), а потім запустіть локальний сервер:

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. Запустіть сервер

Переконайтеся, що ви або запускаєте desktop-застосунок, або запускаєте демон такою командою:

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

Якщо ви використовуєте застосунок, переконайтеся, що у вас увімкнено JIT для комфортної роботи. Докладніше див. у [посібнику LM Studio про JIT і TTL](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict).

3. OpenClaw потребує значення token для LM Studio. Задайте `LM_API_TOKEN`:

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

Якщо автентифікацію LM Studio вимкнено, використовуйте будь-яке непорожнє значення token:

```bash
export LM_API_TOKEN="placeholder-key"
```

Докладніше про налаштування auth у LM Studio див. у [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).

4. Запустіть onboarding і виберіть `LM Studio`:

```bash
openclaw onboard
```

5. Під час onboarding використайте запит `Default model`, щоб вибрати свою модель LM Studio.

Ви також можете задати або змінити її пізніше:

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

Ключі моделей LM Studio мають формат `author/model-name` (наприклад, `qwen/qwen3.5-9b`). Посилання OpenClaw
на моделі додають префікс provider: `lmstudio/qwen/qwen3.5-9b`. Точний ключ моделі
можна знайти, виконавши `curl http://localhost:1234/api/v1/models` і подивившись на поле `key`.

## Неінтерактивний onboarding

Використовуйте неінтерактивний onboarding, коли хочете автоматизувати налаштування (CI, provision, віддалений bootstrap):

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

Або задайте base URL чи модель разом з API key:

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` приймає ключ моделі, який повертає LM Studio (наприклад, `qwen/qwen3.5-9b`), без
префікса provider `lmstudio/`.

Неінтерактивний onboarding вимагає `--lmstudio-api-key` (або `LM_API_TOKEN` у env).
Для серверів LM Studio без автентифікації підійде будь-яке непорожнє значення token.

`--custom-api-key` і далі підтримується для сумісності, але для LM Studio перевага надається `--lmstudio-api-key`.

Це записує `models.providers.lmstudio`, задає типову модель як
`lmstudio/<custom-model-id>` і записує профіль auth `lmstudio:default`.

Інтерактивне налаштування може запропонувати вказати необов’язкову бажану довжину контексту завантаження та застосовує її до виявлених моделей LM Studio, які зберігає в config.

## Конфігурація

### Сумісність потокового використання

LM Studio сумісний із потоковим usage. Коли він не повертає об’єкт
`usage` у форматі OpenAI, OpenClaw відновлює кількість токенів із метаданих
у стилі llama.cpp `timings.prompt_n` / `timings.predicted_n`.

Така сама поведінка застосовується до цих локальних backend, сумісних з OpenAI:

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### Явна конфігурація

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
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

### LM Studio не виявлено

Переконайтеся, що LM Studio запущено і що ви задали `LM_API_TOKEN` (для серверів без автентифікації підійде будь-яке непорожнє значення token):

```bash
# Запуск через desktop-застосунок або в headless-режимі:
lms server start --port 1234
```

Перевірте, що API доступний:

```bash
curl http://localhost:1234/api/v1/models
```

### Помилки автентифікації (HTTP 401)

Якщо під час налаштування з’являється HTTP 401, перевірте свій API key:

- Переконайтеся, що `LM_API_TOKEN` збігається з ключем, налаштованим у LM Studio.
- Докладніше про налаштування auth у LM Studio див. у [LM Studio Authentication](https://lmstudio.ai/docs/developer/core/authentication).
- Якщо ваш сервер не вимагає автентифікації, використовуйте будь-яке непорожнє значення token для `LM_API_TOKEN`.

### Завантаження моделей just-in-time

LM Studio підтримує завантаження моделей just-in-time (JIT), коли моделі завантажуються під час першого запиту. Переконайтеся, що це ввімкнено, щоб уникнути помилок на кшталт "Model not loaded".

## Пов’язане

- [Вибір моделі](/uk/concepts/model-providers)
- [Ollama](/uk/providers/ollama)
- [Локальні моделі](/uk/gateway/local-models)
