---
read_when:
    - Налаштування політики, списків дозволених значень або експериментальних функцій для `tools.*`
    - Реєстрація користувацьких провайдерів або перевизначення базових URL-адрес
    - Налаштування самостійно розміщених кінцевих точок, сумісних з OpenAI
sidebarTitle: Tools and custom providers
summary: Конфігурація інструментів (політика, експериментальні перемикачі, інструменти на основі провайдера) і налаштування користувацького провайдера/base-URL
title: Конфігурація — інструменти та користувацькі провайдери
x-i18n:
    generated_at: "2026-04-26T07:00:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef030940b155224e614675a85c7a81567fd3a493e5ec1c25c5956d49cbc11b86
    source_path: gateway/config-tools.md
    workflow: 15
---

Ключі конфігурації `tools.*` і налаштування користувацького провайдера / base-URL. Для агентів, каналів та інших конфігураційних ключів верхнього рівня див. [Довідку з конфігурації](/uk/gateway/configuration-reference).

## Інструменти

### Профілі інструментів

`tools.profile` задає базовий список дозволених значень перед `tools.allow`/`tools.deny`:

<Note>
Локальний онбординг за замовчуванням встановлює для нових локальних конфігурацій `tools.profile: "coding"`, якщо значення не задано (наявні явно задані профілі зберігаються).
</Note>

| Профіль     | Містить                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `minimal`   | лише `session_status`                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Без обмежень (те саме, що й без значення)                                                                                      |

### Групи інструментів

| Група              | Інструменти                                                                                                            |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як псевдонім для `exec`)                                      |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                 |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                  |
| `group:ui`         | `browser`, `canvas`                                                                                                    |
| `group:automation` | `cron`, `gateway`                                                                                                      |
| `group:messaging`  | `message`                                                                                                              |
| `group:nodes`      | `nodes`                                                                                                                |
| `group:agents`     | `agents_list`                                                                                                          |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                     |
| `group:openclaw`   | Усі вбудовані інструменти (без Plugin провайдерів)                                                                     |

### `tools.allow` / `tools.deny`

Глобальна політика дозволу/заборони інструментів (заборона має пріоритет). Без урахування регістру, підтримуються шаблони `*`. Застосовується навіть коли ізольоване середовище Docker вимкнене.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Додатково обмежує інструменти для конкретних провайдерів або моделей. Порядок: базовий профіль → профіль провайдера → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Керує розширеним доступом `exec` поза межами ізольованого середовища:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Перевизначення на рівні агента (`agents.list[].tools.elevated`) може лише додатково обмежувати.
- `/elevated on|off|ask|full` зберігає стан для кожного сеансу; вбудовані директиви застосовуються до одного повідомлення.
- Розширений `exec` обходить ізоляцію та використовує налаштований шлях виходу (`gateway` за замовчуванням або `node`, коли ціль `exec` — `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

Перевірки безпеки циклів інструментів **за замовчуванням вимкнені**. Установіть `enabled: true`, щоб увімкнути виявлення. Параметри можна визначити глобально в `tools.loopDetection` і перевизначити для агента в `agents.list[].tools.loopDetection`.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  Максимальний обсяг історії викликів інструментів, що зберігається для аналізу циклів.
</ParamField>
<ParamField path="warningThreshold" type="number">
  Поріг повторюваного шаблону без прогресу для попереджень.
</ParamField>
<ParamField path="criticalThreshold" type="number">
  Вищий поріг повторення для блокування критичних циклів.
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  Поріг жорсткої зупинки для будь-якої послідовності без прогресу.
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  Попереджати про повторні виклики того самого інструмента з тими самими аргументами.
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  Попереджати/блокувати відомі інструменти опитування (`process.poll`, `command_status` тощо).
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  Попереджати/блокувати шаблони чергування пар без прогресу.
</ParamField>

<Warning>
Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, валідація завершиться помилкою.
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // або змінна середовища BRAVE_API_KEY
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // необов’язково; пропустіть для автовиявлення
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Налаштовує розуміння вхідного медіаконтенту (зображення/аудіо/відео):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // опційно: надсилати завершені асинхронні music/video безпосередньо в канал
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Поля запису моделі медіа">
    **Запис провайдера** (`type: "provider"` або пропущено):

    - `provider`: ідентифікатор API-провайдера (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
    - `model`: перевизначення ідентифікатора моделі
    - `profile` / `preferredProfile`: вибір профілю з `auth-profiles.json`

    **Запис CLI** (`type: "cli"`):

    - `command`: виконуваний файл для запуску
    - `args`: шаблонізовані аргументи (підтримує `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо)

    **Спільні поля:**

    - `capabilities`: необов’язковий список (`image`, `audio`, `video`). Типові значення: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для кожного запису.
    - У разі помилки використовується наступний запис.

    Автентифікація провайдера дотримується стандартного порядку: `auth-profiles.json` → змінні середовища → `models.providers.*.apiKey`.

    **Поля асинхронного завершення:**

    - `asyncCompletion.directSend`: коли `true`, завершені асинхронні завдання `music_generate` і `video_generate` спочатку намагаються напряму доставити результат у канал. Типове значення: `false` (застарілий шлях пробудження сеансу запитувача/доставлення моделлю).

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Керує тим, які сеанси можуть бути ціллю для інструментів сеансів (`sessions_list`, `sessions_history`, `sessions_send`).

Типове значення: `tree` (поточний сеанс + сеанси, породжені ним, наприклад subagents).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Області видимості">
    - `self`: лише ключ поточного сеансу.
    - `tree`: поточний сеанс + сеанси, породжені поточним сеансом (subagents).
    - `agent`: будь-який сеанс, що належить поточному ідентифікатору агента (може включати інших користувачів, якщо ви запускаєте сеанси для кожного відправника під тим самим ідентифікатором агента).
    - `all`: будь-який сеанс. Націлювання між агентами все одно потребує `tools.agentToAgent`.
    - Обмеження sandbox: коли поточний сеанс працює в sandbox і `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, видимість примусово встановлюється в `tree`, навіть якщо `tools.sessions.visibility="all"`.
  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

Керує підтримкою вбудованих вкладень для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // опційно: встановіть true, щоб дозволити вбудовані файлові вкладення
        maxTotalBytes: 5242880, // усього 5 МБ для всіх файлів
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 МБ на файл
        retainOnSessionKeep: false, // зберігати вкладення, коли cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Примітки щодо вкладень">
    - Вкладення підтримуються лише для `runtime: "subagent"`. Середовище виконання ACP їх відхиляє.
    - Файли матеріалізуються в дочірньому робочому просторі за шляхом `.openclaw/attachments/<uuid>/` із `.manifest.json`.
    - Вміст вкладень автоматично редагується в збережених транскриптах.
    - Вхідні дані base64 перевіряються зі строгими перевірками алфавіту/доповнення та запобіжною перевіркою розміру до декодування.
    - Права доступу до файлів: `0700` для каталогів і `0600` для файлів.
    - Очищення дотримується політики `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише коли `retainOnSessionKeep: true`.
  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

Прапорці експериментальних вбудованих інструментів. Типово вимкнено, якщо не застосовується правило автоувімкнення strict-agentic GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // увімкнути експериментальний update_plan
    },
  },
}
```

- `planTool`: вмикає структурований інструмент `update_plan` для відстеження нетривіальної багатокрокової роботи.
- Типове значення: `false`, якщо тільки `agents.defaults.embeddedPi.executionContract` (або перевизначення для окремого агента) не встановлено в `"strict-agentic"` для запуску OpenAI або OpenAI Codex сімейства GPT-5. Встановіть `true`, щоб примусово ввімкнути інструмент поза цим контекстом, або `false`, щоб залишити його вимкненим навіть для запусків strict-agentic GPT-5.
- Коли ввімкнено, системний промпт також додає настанови з використання, щоб модель застосовувала його лише для суттєвої роботи та тримала не більше одного кроку в стані `in_progress`.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: типова модель для створених субагентів. Якщо не вказано, субагенти успадковують модель викликача.
- `allowAgents`: типовий список дозволених ідентифікаторів цільових агентів для `sessions_spawn`, коли агент-запитувач не задає власний `subagents.allowAgents` (`["*"]` = будь-який; типово: лише той самий агент).
- `runTimeoutSeconds`: типовий тайм-аут (у секундах) для `sessions_spawn`, коли виклик інструмента не містить `runTimeoutSeconds`. `0` означає відсутність тайм-ауту.
- Політика інструментів для субагентів: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Користувацькі провайдери та base URL

OpenClaw використовує вбудований каталог моделей. Додавайте користувацьких провайдерів через `models.providers` у конфігурації або `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (типово) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Автентифікація та пріоритет злиття">
    - Використовуйте `authHeader: true` + `headers` для нестандартних потреб автентифікації.
    - Перевизначайте кореневий каталог конфігурації агента через `OPENCLAW_AGENT_DIR` (або `PI_CODING_AGENT_DIR`, застарілий псевдонім змінної середовища).
    - Пріоритет злиття для провайдерів із однаковими ідентифікаторами:
      - Непорожні значення `baseUrl` з агентського `models.json` мають пріоритет.
      - Непорожні значення `apiKey` з агента мають пріоритет лише тоді, коли для цього провайдера не використовується керування через SecretRef у поточному контексті config/auth-profile.
      - Значення `apiKey` для провайдерів, якими керує SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для посилань на змінні середовища, `secretref-managed` для file/exec-посилань) замість збереження розгорнутих секретів.
      - Значення заголовків провайдера, якими керує SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для посилань на змінні середовища, `secretref-managed` для file/exec-посилань).
      - Порожні або відсутні агентські `apiKey`/`baseUrl` беруться з `models.providers` у конфігурації.
      - Для однакових моделей `contextWindow`/`maxTokens` використовують більше значення між явною конфігурацією та неявними значеннями каталогу.
      - Для однакових моделей `contextTokens` зберігає явне обмеження середовища виконання, якщо воно задане; використовуйте це, щоб обмежити ефективний контекст без зміни рідних метаданих моделі.
      - Використовуйте `models.mode: "replace"`, коли хочете, щоб конфігурація повністю перезаписала `models.json`.
      - Збереження маркерів є авторитетним щодо джерела: маркери записуються з активного знімка конфігурації джерела (до розгортання), а не з розгорнутих значень секретів середовища виконання.
  </Accordion>
</AccordionGroup>

### Подробиці полів провайдера

<AccordionGroup>
  <Accordion title="Каталог верхнього рівня">
    - `models.mode`: поведінка каталогу провайдерів (`merge` або `replace`).
    - `models.providers`: мапа користувацьких провайдерів верхнього рівня з ключами за ідентифікатором провайдера.
      - Безпечне редагування: використовуйте `openclaw config set models.providers.<id> '<json>' --strict-json --merge` або `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` для додаткових оновлень. `config set` відхиляє руйнівні заміни, якщо ви не передасте `--replace`.
  </Accordion>
  <Accordion title="Підключення та автентифікація провайдера">
    - `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` тощо).
    - `models.providers.*.apiKey`: облікові дані провайдера (бажано використовувати підстановку SecretRef/env).
    - `models.providers.*.auth`: стратегія автентифікації (`api-key`, `token`, `oauth`, `aws-sdk`).
    - `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` додає `options.num_ctx` у запити (типово: `true`).
    - `models.providers.*.authHeader`: примусово передає облікові дані в заголовку `Authorization`, якщо це потрібно.
    - `models.providers.*.baseUrl`: базова URL-адреса зовнішнього API.
    - `models.providers.*.headers`: додаткові статичні заголовки для маршрутизації через проксі/tenant.
  </Accordion>
  <Accordion title="Перевизначення транспорту запитів">
    `models.providers.*.request`: перевизначення транспорту для HTTP-запитів провайдера моделей.

    - `request.headers`: додаткові заголовки (об’єднуються зі стандартними значеннями провайдера). Значення підтримують SecretRef.
    - `request.auth`: перевизначення стратегії автентифікації. Режими: `"provider-default"` (використовувати вбудовану автентифікацію провайдера), `"authorization-bearer"` (з `token`), `"header"` (із `headerName`, `value`, необов’язковим `prefix`).
    - `request.proxy`: перевизначення HTTP-проксі. Режими: `"env-proxy"` (використовувати змінні середовища `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (з `url`). Обидва режими підтримують необов’язковий підоб’єкт `tls`.
    - `request.tls`: перевизначення TLS для прямих з’єднань. Поля: `ca`, `cert`, `key`, `passphrase` (усі підтримують SecretRef), `serverName`, `insecureSkipVerify`.
    - `request.allowPrivateNetwork`: коли `true`, дозволяє HTTPS до `baseUrl`, якщо DNS резольвиться в приватні, CGNAT або подібні діапазони, через захист SSRF у HTTP fetch провайдера (операторське opt-in для довірених самостійно розміщених кінцевих точок, сумісних з OpenAI). WebSocket використовує той самий `request` для заголовків/TLS, але не цей захист SSRF fetch. Типово `false`.

  </Accordion>
  <Accordion title="Записи каталогу моделей">
    - `models.providers.*.models`: явні записи каталогу моделей провайдера.
    - `models.providers.*.models.*.contextWindow`: метадані рідного вікна контексту моделі.
    - `models.providers.*.models.*.contextTokens`: необов’язкове обмеження контексту середовища виконання. Використовуйте це, коли хочете менший ефективний бюджет контексту, ніж рідний `contextWindow` моделі; `openclaw models list` показує обидва значення, коли вони відрізняються.
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: необов’язкова підказка сумісності. Для `api: "openai-completions"` із непорожнім нерідним `baseUrl` (хост не `api.openai.com`) OpenClaw примусово встановлює це значення в `false` під час виконання. Порожній/пропущений `baseUrl` зберігає типову поведінку OpenAI.
    - `models.providers.*.models.*.compat.requiresStringContent`: необов’язкова підказка сумісності для чат-ендпойнтів OpenAI-compatible, що підтримують лише рядки. Коли `true`, OpenClaw сплющує масиви суто текстового `messages[].content` у звичайні рядки перед надсиланням запиту.
  </Accordion>
  <Accordion title="Виявлення Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: корінь налаштувань автовиявлення Bedrock.
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнути/вимкнути неявне виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов’язковий фільтр ідентифікаторів провайдера для цільового виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: інтервал опитування для оновлення виявлення.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервне вікно контексту для виявлених моделей.
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервна максимальна кількість вихідних токенів для виявлених моделей.
  </Accordion>
</AccordionGroup>

### Приклади провайдерів

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.6 / 4.7)">
    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/zai-glm-4.6"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Використовуйте `cerebras/zai-glm-4.7` для Cerebras; `zai/glm-4.7` для прямого Z.AI.

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Сумісний з Anthropic, вбудований провайдер. Скорочений варіант: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="Локальні моделі (LM Studio)">
    Див. [Локальні моделі](/uk/gateway/local-models). Коротко: запускайте велику локальну модель через LM Studio Responses API на серйозному обладнанні; залишайте розміщені моделі об’єднаними для резервного варіанта.
  </Accordion>
  <Accordion title="MiniMax M2.7 (напряму)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    Установіть `MINIMAX_API_KEY`. Скорочені варіанти: `openclaw onboard --auth-choice minimax-global-api` або `openclaw onboard --auth-choice minimax-cn-api`. Каталог моделей типово містить лише M2.7. На потоці стримінгу, сумісному з Anthropic, OpenClaw типово вимикає thinking MiniMax, якщо ви явно не встановите `thinking` самостійно. `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed`.

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    Для кінцевої точки в Китаї: `baseUrl: "https://api.moonshot.cn/v1"` або `openclaw onboard --auth-choice moonshot-api-key-cn`.

    Рідні кінцеві точки Moonshot повідомляють про сумісність потокового використання на спільному транспорті `openai-completions`, і OpenClaw визначає це за можливостями кінцевої точки, а не лише за ідентифікатором вбудованого провайдера.

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    Установіть `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`). Використовуйте посилання `opencode/...` для каталогу Zen або посилання `opencode-go/...` для каталогу Go. Скорочений варіант: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`.

  </Accordion>
  <Accordion title="Synthetic (сумісний з Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    Base URL має не містити `/v1` (клієнт Anthropic додає його сам). Скорочений варіант: `openclaw onboard --auth-choice synthetic-api-key`.

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    Установіть `ZAI_API_KEY`. `z.ai/*` і `z-ai/*` — допустимі псевдоніми. Скорочений варіант: `openclaw onboard --auth-choice zai-api-key`.

    - Загальна кінцева точка: `https://api.z.ai/api/paas/v4`
    - Кінцева точка для кодування (типово): `https://api.z.ai/api/coding/paas/v4`
    - Для загальної кінцевої точки визначте користувацького провайдера з перевизначенням base URL.

  </Accordion>
</AccordionGroup>

---

## Пов’язано

- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Конфігурація — канали](/uk/gateway/config-channels)
- [Довідка з конфігурації](/uk/gateway/configuration-reference) — інші ключі верхнього рівня
- [Інструменти та Plugin](/uk/tools)
