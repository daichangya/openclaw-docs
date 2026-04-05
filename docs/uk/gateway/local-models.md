---
read_when:
    - Ви хочете обслуговувати моделі зі свого GPU-сервера
    - Ви налаштовуєте LM Studio або OpenAI-сумісний проксі
    - Вам потрібні найбезпечніші рекомендації щодо локальних моделей
summary: Запуск OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, власні OpenAI-сумісні endpoint)
title: Локальні моделі
x-i18n:
    generated_at: "2026-04-05T18:03:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3b99c8fb57f65c0b765fc75bd36933221b5aeb94c4a3f3428f92640ae064f8b6
    source_path: gateway/local-models.md
    workflow: 15
---

# Локальні моделі

Локальний запуск можливий, але OpenClaw очікує великий контекст + сильний захист від prompt injection. Невеликі карти обрізають контекст і послаблюють безпеку. Орієнтуйтеся на високий рівень: **≥2 повністю укомплектованих Mac Studio або еквівалентний GPU-риг (~$30k+)**. Одна GPU на **24 GB** підходить лише для легших prompt із вищою затримкою. Використовуйте **найбільший / повнорозмірний варіант моделі, який можете запустити**; агресивно квантизовані або “small” checkpoint підвищують ризик prompt injection (див. [Security](/gateway/security)).

Якщо вам потрібне локальне налаштування з найменшими труднощами, почніть з [Ollama](/providers/ollama) і `openclaw onboard`. Ця сторінка — практичний посібник для потужніших локальних стеків і власних локальних серверів, сумісних з OpenAI.

## Рекомендовано: LM Studio + велика локальна модель (Responses API)

Найкращий поточний локальний стек. Завантажте велику модель у LM Studio (наприклад, повнорозмірну збірку Qwen, DeepSeek або Llama), увімкніть локальний сервер (типово `http://127.0.0.1:1234`) і використовуйте Responses API, щоб тримати міркування окремо від фінального тексту.

```json5
{
  agents: {
    defaults: {
      model: { primary: “lmstudio/my-local-model” },
      models: {
        “anthropic/claude-opus-4-6”: { alias: “Opus” },
        “lmstudio/my-local-model”: { alias: “Local” },
      },
    },
  },
  models: {
    mode: “merge”,
    providers: {
      lmstudio: {
        baseUrl: “http://127.0.0.1:1234/v1”,
        apiKey: “lmstudio”,
        api: “openai-responses”,
        models: [
          {
            id: “my-local-model”,
            name: “Local Model”,
            reasoning: false,
            input: [“text”],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Контрольний список налаштування**

- Установіть LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте варіантів “small”/сильно квантизованих), запустіть сервер, переконайтеся, що `http://127.0.0.1:1234/v1/models` її показує.
- Замініть `my-local-model` на фактичний ID моделі, показаний у LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку запуску.
- За потреби скоригуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp використовуйте Responses API, щоб надсилався лише фінальний текст.

Тримайте hosted-моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб резервні варіанти залишалися доступними.

### Гібридна конфігурація: hosted primary, локальний fallback

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Спочатку локально, із hosted safety net

Поміняйте місцями primary і fallback; залиште той самий блок providers і `models.mode: "merge"`, щоб можна було перейти на Sonnet або Opus, коли локальний сервер недоступний.

### Регіональний хостинг / маршрутизація даних

- Hosted-варіанти MiniMax/Kimi/GLM також існують на OpenRouter з endpoint, прив’язаними до регіону (наприклад, розміщеними у США). Виберіть там регіональний варіант, щоб трафік залишався у вибраній вами юрисдикції, і водночас використовуйте `models.mode: "merge"` для fallback на Anthropic/OpenAI.
- Лише локальний запуск залишається найсильнішим варіантом для приватності; регіональна маршрутизація hosted — це проміжний варіант, коли вам потрібні можливості провайдера, але ви хочете контролювати потік даних.

## Інші OpenAI-сумісні локальні проксі

vLLM, LiteLLM, OAI-proxy або власні gateway працюють, якщо вони надають OpenAI-подібний endpoint `/v1`. Замініть блок provider вище своїм endpoint і ID моделі:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Зберігайте `models.mode: "merge"`, щоб hosted-моделі залишалися доступними як fallback.

Примітка щодо поведінки для локальних/проксійованих бекендів `/v1`:

- OpenClaw трактує їх як проксі-подібні OpenAI-сумісні маршрути, а не як нативні endpoint OpenAI
- нативне формування запитів, доступне лише для OpenAI, тут не застосовується: немає
  `service_tier`, немає Responses `store`, немає формування payload сумісності
  reasoning OpenAI і немає підказок для prompt cache
- приховані службові заголовки OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються до цих користувацьких проксі-URL

## Усунення проблем

- Gateway може дістатися до проксі? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio вивантажена? Завантажте її знову; холодний старт — типова причина “зависання”.
- Помилки контексту? Зменште `contextWindow` або підвищте ліміт на своєму сервері.
- Безпека: локальні моделі пропускають фільтри на боці провайдера; тримайте агентів вузькоспеціалізованими, а compaction увімкненим, щоб обмежити радіус ураження від prompt injection.
