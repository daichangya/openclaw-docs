---
read_when:
    - Ви хочете обслуговувати моделі зі свого GPU-сервера
    - Ви налаштовуєте LM Studio або OpenAI-сумісний проксі
    - Вам потрібні найбезпечніші рекомендації щодо локальних моделей
summary: Запускайте OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, власні OpenAI-сумісні ендпоїнти)
title: Локальні моделі
x-i18n:
    generated_at: "2026-04-07T14:58:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: d619d72b0e06914ebacb7e9f38b746caf1b9ce8908c9c6638c3acdddbaa025e8
    source_path: gateway/local-models.md
    workflow: 15
---

# Локальні моделі

Локальний запуск можливий, але OpenClaw очікує великий контекст і сильний захист від інʼєкції промптів. Невеликі карти обрізають контекст і послаблюють безпеку. Орієнтуйтеся на серйозне обладнання: **≥2 Mac Studio з максимальною конфігурацією або еквівалентну GPU-систему (~$30k+)**. Один GPU на **24 ГБ** підходить лише для легших промптів із вищою затримкою. Використовуйте **найбільший / повнорозмірний варіант моделі, який ви можете запустити**; агресивно квантизовані або “small” чекпойнти підвищують ризик інʼєкції промптів (див. [Безпека](/uk/gateway/security)).

Якщо вам потрібне локальне налаштування з найменшими труднощами, почніть з [Ollama](/uk/providers/ollama) і `openclaw onboard`. Ця сторінка — рекомендаційний посібник для більш потужних локальних стеків і власних OpenAI-сумісних локальних серверів.

## Рекомендовано: LM Studio + велика локальна модель (Responses API)

Найкращий поточний локальний стек. Завантажте велику модель у LM Studio (наприклад, повнорозмірну збірку Qwen, DeepSeek або Llama), увімкніть локальний сервер (типово `http://127.0.0.1:1234`) і використовуйте Responses API, щоб відокремити міркування від фінального тексту.

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

- Встановіть LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте варіантів “small”/сильно квантизованих), запустіть сервер, переконайтеся, що `http://127.0.0.1:1234/v1/models` показує її.
- Замініть `my-local-model` на фактичний ідентифікатор моделі, показаний у LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку під час запуску.
- Скоригуйте `contextWindow`/`maxTokens`, якщо у вашій збірці LM Studio вони відрізняються.
- Для WhatsApp дотримуйтеся Responses API, щоб надсилався лише фінальний текст.

Залишайте хостовані моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб резервні варіанти залишалися доступними.

### Гібридна конфігурація: основна хостована модель, локальний резервний варіант

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

### Спочатку локально, із хостованою страховкою

Поміняйте місцями основну модель і резервні варіанти; збережіть той самий блок providers і `models.mode: "merge"`, щоб мати змогу переключитися на Sonnet або Opus, коли локальний сервер недоступний.

### Регіональний хостинг / маршрутизація даних

- Хостовані варіанти MiniMax/Kimi/GLM також доступні в OpenRouter з ендпоїнтами, привʼязаними до регіону (наприклад, хостинг у США). Виберіть там регіональний варіант, щоб трафік залишався у вибраній юрисдикції, і водночас використовуйте `models.mode: "merge"` для резервних варіантів Anthropic/OpenAI.
- Лише локальний запуск залишається найсильнішим шляхом до конфіденційності; регіональна хостована маршрутизація — це компромісний варіант, коли вам потрібні можливості провайдера, але ви хочете контролювати потік даних.

## Інші OpenAI-сумісні локальні проксі

vLLM, LiteLLM, OAI-proxy або власні шлюзи працюють, якщо вони надають OpenAI-подібний ендпоїнт `/v1`. Замініть наведений вище блок provider на свій ендпоїнт та ідентифікатор моделі:

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

Зберігайте `models.mode: "merge"`, щоб хостовані моделі залишалися доступними як резервні варіанти.

Примітка щодо поведінки локальних/проксійованих бекендів `/v1`:

- OpenClaw розглядає їх як проксі-подібні OpenAI-сумісні маршрути, а не як нативні ендпоїнти OpenAI
- формування запитів, притаманне лише нативному OpenAI, тут не застосовується: без
  `service_tier`, без Responses `store`, без формування payload сумісності з OpenAI reasoning
  і без підказок для кешу промптів
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються до цих власних проксі-URL

Примітки щодо сумісності для суворіших OpenAI-сумісних бекендів:

- Деякі сервери приймають у Chat Completions лише рядковий `messages[].content`, а не
  структуровані масиви частин контенту. Для
  таких ендпоїнтів установіть `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- Деякі менші або суворіші локальні бекенди нестабільно працюють із повною
  формою промптів runtime агента OpenClaw, особливо коли включені схеми інструментів. Якщо
  бекенд працює для маленьких прямих викликів `/v1/chat/completions`, але збій відбувається на звичайних
  ходах агента OpenClaw, спочатку спробуйте
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Якщо бекенд усе ще збоїть лише на більших запусках OpenClaw, то, як правило, проблема
  у можливостях моделі/сервера на стороні апстріму або в помилці бекенда, а не в транспортному
  шарі OpenClaw.

## Усунення несправностей

- Gateway може дістатися до проксі? `curl http://127.0.0.1:1234/v1/models`.
- Модель у LM Studio вивантажена? Завантажте її знову; холодний старт — поширена причина “зависання”.
- Помилки контексту? Зменште `contextWindow` або підвищте ліміт на своєму сервері.
- OpenAI-сумісний сервер повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` для запису цієї моделі.
- Прямі маленькі виклики `/v1/chat/completions` працюють, але `openclaw infer model run`
  завершується з помилкою на Gemma або іншій локальній моделі? Спочатку вимкніть схеми інструментів за допомогою
  `compat.supportsTools: false`, а потім повторіть перевірку. Якщо сервер і далі падає лише
  на більших промптах OpenClaw, вважайте це обмеженням моделі/сервера на стороні апстріму.
- Безпека: локальні моделі пропускають фільтри на боці провайдера; звужуйте агентів і тримайте compaction увімкненим, щоб обмежити радіус впливу інʼєкції промптів.
