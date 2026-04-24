---
read_when:
    - Ви хочете обслуговувати моделі зі свого власного GPU-сервера
    - Ви налаштовуєте LM Studio або сумісний з OpenAI proxy
    - Вам потрібні найбезпечніші рекомендації щодо локальних моделей
summary: Запускайте OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, власні кінцеві точки OpenAI)
title: Локальні моделі
x-i18n:
    generated_at: "2026-04-24T03:16:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9315b03b4bacd44af50ebec899f1d13397b9ae91bde21742fe9f022c23d1e95c
    source_path: gateway/local-models.md
    workflow: 15
---

Локальний запуск можливий, але OpenClaw очікує великий контекст і сильний захист від ін’єкцій у prompt. Невеликі карти обрізають контекст і послаблюють безпеку. Орієнтуйтеся на **≥2 Mac Studio з максимальною конфігурацією або еквівалентну GPU-систему (~$30k+)**. Одна GPU з **24 GB** працює лише для легших prompt із вищою затримкою. Використовуйте **найбільший / повнорозмірний варіант моделі, який можете запустити**; агресивно квантизовані або «малі» checkpoint підвищують ризик ін’єкцій у prompt (див. [Безпека](/uk/gateway/security)).

Якщо вам потрібне найпростіше локальне налаштування, почніть із [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) і `openclaw onboard`. Ця сторінка — практичний посібник для потужніших локальних стеків і власних локальних серверів, сумісних з OpenAI.

## Рекомендовано: LM Studio + велика локальна модель (Responses API)

Найкращий поточний локальний стек. Завантажте велику модель у LM Studio (наприклад, повнорозмірну збірку Qwen, DeepSeek або Llama), увімкніть локальний сервер (типово `http://127.0.0.1:1234`) і використовуйте Responses API, щоб тримати reasoning окремо від фінального тексту.

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
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте «малих»/сильно квантизованих варіантів), запустіть сервер, переконайтеся, що `http://127.0.0.1:1234/v1/models` її показує.
- Замініть `my-local-model` на фактичний ідентифікатор моделі, який показує LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку запуску.
- Відкоригуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp дотримуйтеся Responses API, щоб надсилався лише фінальний текст.

Залишайте також налаштовані хмарні моделі навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб резервні варіанти залишалися доступними.

### Гібридна конфігурація: основна хмарна модель, локальна резервна

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

### Локальна модель як основна з хмарною страховкою

Поміняйте місцями основну модель і порядок резервних; збережіть той самий блок providers і `models.mode: "merge"`, щоб можна було перейти на Sonnet або Opus, коли локальний сервер недоступний.

### Регіональний хостинг / маршрутизація даних

- Хмарні варіанти MiniMax/Kimi/GLM також доступні в OpenRouter з endpoint, прив’язаними до регіону (наприклад, хостинг у США). Вибирайте там регіональний варіант, щоб трафік залишався в обраній юрисдикції, і водночас використовуйте `models.mode: "merge"` для резервних варіантів Anthropic/OpenAI.
- Лише локальний запуск залишається найсильнішим варіантом з погляду приватності; регіональна хмарна маршрутизація — це компромісний варіант, коли вам потрібні можливості provider, але ви хочете контролювати потік даних.

## Інші локальні proxy, сумісні з OpenAI

vLLM, LiteLLM, OAI-proxy або власні gateway працюють, якщо вони надають endpoint `/v1` у стилі OpenAI. Замініть блок provider вище своїм endpoint і ідентифікатором моделі:

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

Зберігайте `models.mode: "merge"`, щоб хмарні моделі залишалися доступними як резервні.

Примітка щодо поведінки для локальних/proxy backend `/v1`:

- OpenClaw розглядає їх як proxy-маршрути у стилі OpenAI, а не як рідні
  endpoint OpenAI
- тут не застосовується формування запитів, властиве лише нативному OpenAI: без
  `service_tier`, без Responses `store`, без формування payload для сумісності з OpenAI reasoning
  і без підказок кешу prompt
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються до цих власних proxy URL

Примітки щодо сумісності для суворіших backend, сумісних з OpenAI:

- Деякі сервери приймають лише рядковий `messages[].content` у Chat Completions, а не
  структуровані масиви частин контенту. Установіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true` для
  таких endpoint.
- Деякі менші або суворіші локальні backend нестабільно працюють із повною
  формою prompt середовища виконання агента OpenClaw, особливо коли включено схеми інструментів. Якщо
  backend працює для крихітних прямих викликів `/v1/chat/completions`, але не працює на звичайних
  ходах агента OpenClaw, спочатку спробуйте
  `agents.defaults.experimental.localModelLean: true`, щоб прибрати важкі
  типові інструменти на кшталт `browser`, `cron` і `message`; це експериментальний
  прапорець, а не стабільне налаштування типового режиму. Див.
  [Експериментальні можливості](/uk/concepts/experimental-features). Якщо це не допоможе, спробуйте
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Якщо backend усе ще не працює лише на більших запусках OpenClaw, то решта проблеми
  зазвичай пов’язана з потужністю моделі/сервера на upstream або з помилкою backend, а не з транспортним рівнем OpenClaw.

## Усунення проблем

- Gateway може досягти proxy? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio вивантажена? Завантажте знову; холодний старт — поширена причина «зависання».
- OpenClaw попереджає, коли виявлене вікно контексту менше за **32k**, і блокує роботу нижче **16k**. Якщо ви натрапили на цю попередню перевірку, збільште ліміт контексту сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або підвищте ліміт сервера.
- Сервер, сумісний з OpenAI, повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` до запису цієї моделі.
- Прямі маленькі виклики `/v1/chat/completions` працюють, але `openclaw infer model run`
  не працює на Gemma або іншій локальній моделі? Спочатку вимкніть схеми інструментів через
  `compat.supportsTools: false`, а потім перевірте ще раз. Якщо сервер і далі падає лише
  на більших prompt OpenClaw, вважайте це обмеженням upstream-сервера/моделі.
- Безпека: локальні моделі пропускають фільтри на боці provider; звужуйте можливості агентів і залишайте ввімкнений compaction, щоб обмежити радіус ураження від ін’єкцій у prompt.

## Пов’язано

- [Довідник з конфігурації](/uk/gateway/configuration-reference)
- [Резервне перемикання моделей](/uk/concepts/model-failover)
