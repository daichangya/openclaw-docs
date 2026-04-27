---
read_when:
    - Ви хочете надавати моделі зі свого власного GPU-сервера
    - Ви налаштовуєте LM Studio або сумісний з OpenAI проксі
    - Вам потрібні найбезпечніші рекомендації щодо локальних моделей
summary: Запускайте OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, власні OpenAI endpoint-и)
title: Локальні моделі
x-i18n:
    generated_at: "2026-04-27T04:33:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b6c3952f6384038fef3b2afd5cf623b6a1744072b789240f394dc7552751f2b
    source_path: gateway/local-models.md
    workflow: 15
---

Локально це можливо, але OpenClaw очікує великий контекст + сильний захист від prompt injection. Невеликі карти обрізають контекст і послаблюють безпеку. Орієнтуйтеся на високий рівень: **≥2 Mac Studio з максимальною конфігурацією або еквівалентна GPU-установка (~$30k+)**. Одна GPU з **24 GB** підійде лише для легших запитів і з більшою затримкою. Використовуйте **найбільший / повнорозмірний варіант моделі, який можете запустити**; агресивно квантизовані або “small” checkpoint-и підвищують ризик prompt injection (див. [Security](/uk/gateway/security)).

Якщо вам потрібне локальне налаштування з найменшими складнощами, почніть із [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) та `openclaw onboard`. Ця сторінка — рекомендаційний посібник для потужніших локальних стеків і власних локальних серверів, сумісних з OpenAI.

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
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте “small”/сильно квантизованих варіантів), запустіть сервер і переконайтеся, що `http://127.0.0.1:1234/v1/models` показує її в списку.
- Замініть `my-local-model` на фактичний ID моделі, показаний у LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку під час старту.
- За потреби скоригуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp дотримуйтеся Responses API, щоб надсилався лише фінальний текст.

Тримайте hosted-моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб fallback-моделі залишалися доступними.

### Гібридна конфігурація: hosted primary, local fallback

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

Поміняйте місцями порядок primary і fallback; залиште той самий блок providers і `models.mode: "merge"`, щоб можна було перейти на Sonnet або Opus, якщо локальний сервер недоступний.

### Регіональний хостинг / маршрутизація даних

- Hosted-варіанти MiniMax/Kimi/GLM також доступні в OpenRouter з endpoint-ами, прив’язаними до регіону (наприклад, хостинг у США). Виберіть там регіональний варіант, щоб трафік залишався у вибраній вами юрисдикції, і водночас використовуйте `models.mode: "merge"` для fallback до Anthropic/OpenAI.
- Лише локальний варіант залишається найсильнішим шляхом для приватності; hosted-регіональна маршрутизація — це компромісний варіант, коли вам потрібні можливості провайдера, але ви хочете контролювати потік даних.

## Інші локальні проксі, сумісні з OpenAI

vLLM, LiteLLM, OAI-proxy або власні шлюзи працюють, якщо вони надають endpoint `/v1` у стилі OpenAI. Замініть блок provider вище на свій endpoint і ID моделі:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        timeoutSeconds: 300,
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

Залишайте `models.mode: "merge"`, щоб hosted-моделі залишалися доступними як fallback.
Використовуйте `models.providers.<id>.timeoutSeconds` для повільних локальних або віддалених
серверів моделей перед тим, як збільшувати `agents.defaults.timeoutSeconds`. Тайм-аут провайдера
застосовується лише до HTTP-запитів до моделей, включно зі встановленням з’єднання, заголовками, потоковою
передачею тіла відповіді та загальним guarded-fetch abort.

Примітка щодо поведінки локальних/проксійованих backend-ів `/v1`:

- OpenClaw обробляє їх як проксі-маршрути, сумісні з OpenAI, а не як нативні
  endpoint-и OpenAI
- тут не застосовується формування запитів, характерне лише для нативного OpenAI:
  без `service_tier`, без Responses `store`, без OpenAI reasoning-compat payload
  shaping і без підказок для prompt cache
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються до цих користувацьких проксі-URL

Примітки щодо сумісності для суворіших backend-ів, сумісних з OpenAI:

- Деякі сервери приймають у Chat Completions лише рядковий `messages[].content`, а не
  структуровані масиви content-part. Для таких endpoint-ів задайте
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- Деякі менші або суворіші локальні backend-и нестабільно працюють із повною
  формою prompt-ів середовища агента OpenClaw, особливо коли включені схеми інструментів. Якщо
  backend працює для маленьких прямих викликів `/v1/chat/completions`, але не справляється зі звичайними
  ходами агента OpenClaw, спершу спробуйте
  `agents.defaults.experimental.localModelLean: true`, щоб прибрати важкі
  стандартні інструменти, як-от `browser`, `cron` і `message`; це експериментальний
  прапорець, а не стабільне налаштування режиму за замовчуванням. Див.
  [Experimental Features](/uk/concepts/experimental-features). Якщо це не допоможе, спробуйте
  `models.providers.<provider>.models[].compat.supportsTools: false`.
- Якщо backend усе ще не працює лише на більших запусках OpenClaw, то проблема, як правило,
  полягає в обмеженнях моделі/сервера на стороні upstream або в помилці backend-а, а не в транспортному шарі OpenClaw.

## Усунення проблем

- Gateway може звернутися до проксі? `curl http://127.0.0.1:1234/v1/models`.
- Модель у LM Studio вивантажена? Завантажте її знову; холодний старт — часта причина “зависання”.
- OpenClaw попереджає, коли виявлене вікно контексту менше за **32k**, і блокує запуск нижче за **16k**. Якщо ви зіткнулися з цією попередньою перевіркою, збільште ліміт контексту сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або збільште ліміт сервера.
- OpenAI-сумісний сервер повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` у запис цієї моделі.
- Маленькі прямі виклики `/v1/chat/completions` працюють, але `openclaw infer model run`
  не працює з Gemma або іншою локальною моделлю? Спочатку вимкніть схеми інструментів через
  `compat.supportsTools: false`, а потім перевірте ще раз. Якщо сервер усе ще падає лише
  на більших prompt-ах OpenClaw, розглядайте це як обмеження upstream-сервера/моделі.
- Безпека: локальні моделі оминають фільтри на стороні провайдера; тримайте агентів вузькоспеціалізованими та вмикайте Compaction, щоб обмежити радіус ураження від prompt injection.

## Пов’язане

- [Configuration reference](/uk/gateway/configuration-reference)
- [Model failover](/uk/concepts/model-failover)
