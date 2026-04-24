---
read_when:
    - Налаштування policy, allowlist або експериментальних можливостей `tools.*`
    - Реєстрація власних providers або перевизначення base URL
    - Налаштування самостійно розміщених endpoint, сумісних з OpenAI
summary: Конфігурація Tools (policy, experimental toggles, provider-backed tools) і власне налаштування provider/base-URL
title: Конфігурація — Tools і власні providers
x-i18n:
    generated_at: "2026-04-24T03:44:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92535fb937f688c7cd39dcf5fc55f4663c8d234388a46611527efad4b7ee85eb
    source_path: gateway/config-tools.md
    workflow: 15
---

Ключі конфігурації `tools.*` і налаштування власних provider / base URL. Для агентів,
каналів та інших конфігурацій верхнього рівня див.
[Довідник конфігурації](/uk/gateway/configuration-reference).

## Tools

### Профілі інструментів

`tools.profile` задає базовий allowlist перед `tools.allow`/`tools.deny`:

Локальний онбординг типово встановлює для нових локальних конфігурацій `tools.profile: "coding"`, якщо значення не задано (наявні явно вказані профілі зберігаються).

| Профіль     | Містить                                                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | лише `session_status`                                                                                                            |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                        |
| `full`      | Без обмежень (так само, як і без значення)                                                                                       |

### Групи інструментів

| Група              | Інструменти                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` приймається як псевдонім для `exec`)                                        |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Усі вбудовані інструменти (без provider Plugin)                                                                         |

### `tools.allow` / `tools.deny`

Глобальна політика дозволу/заборони інструментів (заборона має пріоритет). Нечутлива до регістру, підтримує wildcard `*`. Застосовується навіть коли sandbox Docker вимкнено.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Додатково обмежує інструменти для конкретних provider або моделей. Порядок: базовий профіль → профіль provider → allow/deny.

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

Керує elevated-доступом `exec` поза sandbox:

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

- Перевизначення для окремого агента (`agents.list[].tools.elevated`) може лише додатково обмежувати.
- `/elevated on|off|ask|full` зберігає стан для кожної сесії; inline-директиви застосовуються лише до одного повідомлення.
- Elevated `exec` обходить sandbox і використовує налаштований шлях виходу (`gateway` типово, або `node`, коли ціллю exec є `node`).

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

Перевірки безпеки від циклів інструментів **типово вимкнені**. Установіть `enabled: true`, щоб увімкнути виявлення.
Налаштування можна задати глобально в `tools.loopDetection` і перевизначити для окремого агента в `agents.list[].tools.loopDetection`.

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

- `historySize`: максимальна історія викликів інструментів, що зберігається для аналізу циклів.
- `warningThreshold`: поріг повторюваного шаблону без прогресу для попереджень.
- `criticalThreshold`: вищий поріг повторення для блокування критичних циклів.
- `globalCircuitBreakerThreshold`: жорсткий поріг зупинки для будь-якого запуску без прогресу.
- `detectors.genericRepeat`: попереджати про повторні виклики того самого інструмента з тими самими аргументами.
- `detectors.knownPollNoProgress`: попереджати/блокувати відомі poll-інструменти (`process.poll`, `command_status` тощо).
- `detectors.pingPong`: попереджати/блокувати шаблони чергування пар без прогресу.
- Якщо `warningThreshold >= criticalThreshold` або `criticalThreshold >= globalCircuitBreakerThreshold`, перевірка не проходить.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
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

Налаштовує розуміння вхідних медіа (зображення/аудіо/відео):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: send finished async music/video directly to the channel
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

<Accordion title="Поля запису моделі медіа">

**Запис provider** (`type: "provider"` або без вказання):

- `provider`: id API provider (`openai`, `anthropic`, `google`/`gemini`, `groq` тощо)
- `model`: перевизначення id моделі
- `profile` / `preferredProfile`: вибір профілю з `auth-profiles.json`

**Запис CLI** (`type: "cli"`):

- `command`: виконуваний файл для запуску
- `args`: шаблонізовані аргументи (підтримуються `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` тощо)

**Спільні поля:**

- `capabilities`: необов’язковий список (`image`, `audio`, `video`). Типові значення: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: перевизначення для окремого запису.
- У разі помилки використовується наступний запис.

Автентифікація provider дотримується стандартного порядку: `auth-profiles.json` → змінні середовища → `models.providers.*.apiKey`.

**Поля асинхронного завершення:**

- `asyncCompletion.directSend`: коли `true`, завершені асинхронні завдання `music_generate`
  і `video_generate` спочатку намагаються доставлятися безпосередньо в канал. Типове значення: `false`
  (застарілий шлях requester-session wake/model-delivery).

</Accordion>

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

Керує тим, на які сесії можуть бути націлені session tools (`sessions_list`, `sessions_history`, `sessions_send`).

Типове значення: `tree` (поточна сесія + сесії, створені нею, наприклад субагенти).

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

Примітки:

- `self`: лише ключ поточної сесії.
- `tree`: поточна сесія + сесії, створені поточною сесією (субагенти).
- `agent`: будь-яка сесія, що належить поточному id агента (може включати інших користувачів, якщо ви запускаєте окремі сесії для відправників під тим самим id агента).
- `all`: будь-яка сесія. Націлення між агентами все одно потребує `tools.agentToAgent`.
- Обмеження sandbox: коли поточна сесія працює в sandbox і `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, видимість примусово встановлюється на `tree`, навіть якщо `tools.sessions.visibility="all"`.

### `tools.sessions_spawn`

Керує підтримкою inline-вкладень для `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

Примітки:

- Вкладення підтримуються лише для `runtime: "subagent"`. Runtime ACP їх відхиляє.
- Файли матеріалізуються в дочірньому робочому просторі в `.openclaw/attachments/<uuid>/` разом із `.manifest.json`.
- Вміст вкладень автоматично редагується під час збереження транскрипту.
- Входи Base64 перевіряються за допомогою суворої перевірки алфавіту/вирівнювання та захисту розміру до декодування.
- Права доступу до файлів: `0700` для каталогів і `0600` для файлів.
- Очищення виконується згідно з політикою `cleanup`: `delete` завжди видаляє вкладення; `keep` зберігає їх лише коли `retainOnSessionKeep: true`.

<a id="toolsexperimental"></a>

### `tools.experimental`

Експериментальні прапорці вбудованих інструментів. Типово вимкнено, якщо не застосовується правило автоувімкнення strict-agentic GPT-5.

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

Примітки:

- `planTool`: вмикає структурований інструмент `update_plan` для відстеження нетривіальної багатокрокової роботи.
- Типове значення: `false`, якщо тільки `agents.defaults.embeddedPi.executionContract` (або перевизначення для окремого агента) не встановлено в `"strict-agentic"` для запуску OpenAI або OpenAI Codex сімейства GPT-5. Установіть `true`, щоб примусово ввімкнути інструмент поза цією областю, або `false`, щоб залишити його вимкненим навіть для запусків strict-agentic GPT-5.
- Коли інструмент увімкнено, system prompt також додає вказівки щодо використання, щоб модель застосовувала його лише для суттєвої роботи й підтримувала не більше одного кроку `in_progress`.

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

- `model`: типова модель для створених субагентів. Якщо не вказано, субагенти успадковують модель викликувача.
- `allowAgents`: типовий allowlist цільових id агентів для `sessions_spawn`, коли агент-запитувач не задає власний `subagents.allowAgents` (`["*"]` = будь-який; типово: лише той самий агент).
- `runTimeoutSeconds`: типовий тайм-аут (у секундах) для `sessions_spawn`, коли виклик інструмента не вказує `runTimeoutSeconds`. `0` означає відсутність тайм-ауту.
- Політика інструментів для субагентів: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Власні providers і base URL

OpenClaw використовує вбудований каталог моделей. Додавайте власні providers через `models.providers` у конфігурації або `~/.openclaw/agents/<agentId>/agent/models.json`.

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
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

- Використовуйте `authHeader: true` + `headers` для власних потреб автентифікації.
- Перевизначайте корінь конфігурації агента через `OPENCLAW_AGENT_DIR` (або `PI_CODING_AGENT_DIR`, застарілий псевдонім змінної середовища).
- Пріоритет злиття для provider ID, що збігаються:
  - Непорожні значення `baseUrl` з агентського `models.json` мають пріоритет.
  - Непорожні значення `apiKey` з агента мають пріоритет лише тоді, коли цей provider не керується через SecretRef у поточному контексті config/auth-profile.
  - Значення `apiKey` для provider, керованих через SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для env-посилань, `secretref-managed` для file/exec-посилань) замість збереження розв’язаних секретів.
  - Значення заголовків для provider, керованих через SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для env-посилань, `secretref-managed` для file/exec-посилань).
  - Порожні або відсутні агентські `apiKey`/`baseUrl` беруться з `models.providers` у конфігурації.
  - Для моделей, що збігаються, `contextWindow`/`maxTokens` використовують більше значення між явною конфігурацією та неявними значеннями каталогу.
  - Для моделей, що збігаються, `contextTokens` зберігає явне обмеження runtime, якщо воно задане; використовуйте це, щоб обмежити ефективний контекст без зміни рідних метаданих моделі.
  - Використовуйте `models.mode: "replace"`, коли хочете, щоб конфігурація повністю переписала `models.json`.
  - Збереження маркерів є джерельно-авторитетним: маркери записуються з активного знімка конфігурації джерела (до розв’язання), а не з розв’язаних значень секретів runtime.

### Докладніше про поля provider

- `models.mode`: поведінка каталогу provider (`merge` або `replace`).
- `models.providers`: мапа власних providers із ключем за id provider.
  - Безпечні редагування: використовуйте `openclaw config set models.providers.<id> '<json>' --strict-json --merge` або `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` для додаткових оновлень. `config set` відмовляється від руйнівних замін, якщо ви не передасте `--replace`.
- `models.providers.*.api`: адаптер запитів (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` тощо).
- `models.providers.*.apiKey`: облікові дані provider (краще через SecretRef/env-підстановку).
- `models.providers.*.auth`: стратегія автентифікації (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: для Ollama + `openai-completions` вставляє `options.num_ctx` у запити (типово: `true`).
- `models.providers.*.authHeader`: примусово передає облікові дані в заголовку `Authorization`, коли це потрібно.
- `models.providers.*.baseUrl`: базовий URL висхідного API.
- `models.providers.*.headers`: додаткові статичні заголовки для маршрутизації через proxy/tenant.
- `models.providers.*.request`: перевизначення транспорту для HTTP-запитів model-provider.
  - `request.headers`: додаткові заголовки (зливаються з типовими для provider). Значення приймають SecretRef.
  - `request.auth`: перевизначення стратегії автентифікації. Режими: `"provider-default"` (використовувати вбудовану автентифікацію provider), `"authorization-bearer"` (з `token`), `"header"` (з `headerName`, `value`, необов’язковим `prefix`).
  - `request.proxy`: перевизначення HTTP proxy. Режими: `"env-proxy"` (використовувати змінні середовища `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (з `url`). Обидва режими приймають необов’язковий підоб’єкт `tls`.
  - `request.tls`: перевизначення TLS для прямих з’єднань. Поля: `ca`, `cert`, `key`, `passphrase` (усі приймають SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: коли `true`, дозволяє HTTPS до `baseUrl`, якщо DNS розв’язується в private, CGNAT або подібні діапазони, через захист HTTP fetch provider від SSRF (явне ввімкнення оператором для довірених самостійно розміщених endpoint, сумісних з OpenAI). WebSocket використовує той самий `request` для заголовків/TLS, але не цей SSRF-захист fetch. Типове значення `false`.
- `models.providers.*.models`: явні записи каталогу моделей provider.
- `models.providers.*.models.*.contextWindow`: метадані рідного вікна контексту моделі.
- `models.providers.*.models.*.contextTokens`: необов’язкове обмеження контексту runtime. Використовуйте це, якщо хочете менший ефективний бюджет контексту, ніж рідний `contextWindow` моделі.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: необов’язкова підказка сумісності. Для `api: "openai-completions"` з непорожнім нерідним `baseUrl` (хост не `api.openai.com`) OpenClaw примусово встановлює це в `false` під час runtime. Порожній/відсутній `baseUrl` зберігає типову поведінку OpenAI.
- `models.providers.*.models.*.compat.requiresStringContent`: необов’язкова підказка сумісності для OpenAI-сумісних chat endpoint, які приймають лише рядки. Коли `true`, OpenClaw перетворює масиви `messages[].content`, що містять лише текст, у звичайні рядки перед надсиланням запиту.
- `plugins.entries.amazon-bedrock.config.discovery`: корінь налаштувань авто-виявлення Bedrock.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: увімкнути/вимкнути неявне виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.region`: регіон AWS для виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: необов’язковий фільтр id provider для цільового виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: інтервал опитування для оновлення виявлення.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: резервне вікно контексту для виявлених моделей.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: резервна максимальна кількість вихідних токенів для виявлених моделей.

### Приклади provider

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

Установіть `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`). Використовуйте посилання `opencode/...` для каталогу Zen або `opencode-go/...` для каталогу Go. Скорочення: `openclaw onboard --auth-choice opencode-zen` або `openclaw onboard --auth-choice opencode-go`.

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

Установіть `ZAI_API_KEY`. `z.ai/*` і `z-ai/*` — допустимі псевдоніми. Скорочення: `openclaw onboard --auth-choice zai-api-key`.

- Загальний endpoint: `https://api.z.ai/api/paas/v4`
- Endpoint для кодування (типовий): `https://api.z.ai/api/coding/paas/v4`
- Для загального endpoint визначте власний provider із перевизначенням base URL.

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

Для endpoint у Китаї: `baseUrl: "https://api.moonshot.cn/v1"` або `openclaw onboard --auth-choice moonshot-api-key-cn`.

Рідні endpoint Moonshot рекламують сумісність streaming usage на спільному
транспорті `openai-completions`, і OpenClaw визначає це за можливостями endpoint,
а не лише за id вбудованого provider.

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

Сумісний з Anthropic, вбудований provider. Скорочення: `openclaw onboard --auth-choice kimi-code-api-key`.

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

Base URL має не містити `/v1` (клієнт Anthropic додає його сам). Скорочення: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

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
            input: ["text", "image"],
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

Установіть `MINIMAX_API_KEY`. Скорочення:
`openclaw onboard --auth-choice minimax-global-api` або
`openclaw onboard --auth-choice minimax-cn-api`.
Каталог моделей типово містить лише M2.7.
На Anthropic-сумісному streaming path OpenClaw типово вимикає thinking MiniMax,
якщо ви явно не задасте `thinking` самостійно. `/fast on` або
`params.fastMode: true` переписує `MiniMax-M2.7` на
`MiniMax-M2.7-highspeed`.

</Accordion>

<Accordion title="Локальні моделі (LM Studio)">

Див. [Локальні моделі](/uk/gateway/local-models). Коротко: запускайте велику локальну модель через LM Studio Responses API на достатньо потужному обладнанні; зберігайте злиття з розміщеними моделями як резервний варіант.

</Accordion>

---

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference) — інші ключі верхнього рівня
- [Конфігурація — агенти](/uk/gateway/config-agents)
- [Конфігурація — канали](/uk/gateway/config-channels)
- [Tools і plugins](/uk/tools)
