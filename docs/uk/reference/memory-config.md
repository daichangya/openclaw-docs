---
read_when:
    - Ви хочете налаштувати провайдерів пошуку в пам’яті або моделі embedding
    - Ви хочете налаштувати бекенд QMD
    - Ви хочете налаштувати гібридний пошук, MMR або часовий спад
    - Ви хочете ввімкнути мультимодальне індексування пам’яті
summary: Усі параметри конфігурації для пошуку в пам’яті, провайдерів embedding, QMD, гібридного пошуку та мультимодального індексування
title: Довідка з конфігурації пам’яті
x-i18n:
    generated_at: "2026-04-24T03:48:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9152d6cdf3959319c2ba000fae06c72b27b9b8c90ee08ce57b80d1c0670f850
    source_path: reference/memory-config.md
    workflow: 15
---

Ця сторінка перелічує всі параметри конфігурації для пошуку в пам’яті OpenClaw. Для
концептуальних оглядів див.:

- [Memory Overview](/uk/concepts/memory) -- як працює пам’ять
- [Builtin Engine](/uk/concepts/memory-builtin) -- типовий бекенд SQLite
- [QMD Engine](/uk/concepts/memory-qmd) -- local-first sidecar
- [Memory Search](/uk/concepts/memory-search) -- pipeline пошуку та налаштування
- [Active Memory](/uk/concepts/active-memory) -- увімкнення субагента пам’яті для інтерактивних сесій

Усі налаштування пошуку в пам’яті розміщені в `agents.defaults.memorySearch` у
`openclaw.json`, якщо не зазначено інше.

Якщо ви шукаєте перемикач функції **Active Memory** і конфігурацію субагента,
вони розміщені в `plugins.entries.active-memory`, а не в `memorySearch`.

Active Memory використовує модель із двома умовами:

1. Plugin має бути ввімкнений і націлений на id поточного агента
2. запит має бути придатною інтерактивною постійною сесією чату

Див. [Active Memory](/uk/concepts/active-memory) для моделі активації,
конфігурації, якою володіє Plugin, збереження transcript і безпечного шаблону розгортання.

---

## Вибір провайдера

| Ключ      | Тип       | Типово          | Опис                                                                                                                |
| --------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string` | визначається автоматично | ID адаптера embedding: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`   | `string`  | типове значення провайдера | Назва моделі embedding                                                                                         |
| `fallback` | `string` | `"none"`         | ID fallback-адаптера, коли основний збійний                                                                        |
| `enabled` | `boolean` | `true`           | Увімкнути або вимкнути пошук у пам’яті                                                                              |

### Порядок автовизначення

Коли `provider` не задано, OpenClaw вибирає перший доступний:

1. `local` -- якщо налаштовано `memorySearch.local.modelPath` і файл існує.
2. `github-copilot` -- якщо можна визначити токен GitHub Copilot (з env var або auth profile).
3. `openai` -- якщо можна визначити ключ OpenAI.
4. `gemini` -- якщо можна визначити ключ Gemini.
5. `voyage` -- якщо можна визначити ключ Voyage.
6. `mistral` -- якщо можна визначити ключ Mistral.
7. `bedrock` -- якщо визначається ланцюжок облікових даних AWS SDK (роль екземпляра, ключі доступу, profile, SSO, web identity або спільна конфігурація).

`ollama` підтримується, але не визначається автоматично (задайте його явно).

### Визначення API key

Віддалені embedding потребують API key. Натомість Bedrock використовує типовий
ланцюжок облікових даних AWS SDK (ролі екземпляра, SSO, ключі доступу).

| Провайдер      | Env var                                            | Ключ конфігурації                |
| -------------- | -------------------------------------------------- | -------------------------------- |
| Bedrock        | ланцюжок облікових даних AWS                       | API key не потрібен              |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey` |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Auth profile через device login  |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (заповнювач)                      | --                               |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey` |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey` |

Codex OAuth покриває лише chat/completions і не задовольняє embedding-запити.

---

## Конфігурація віддаленого endpoint

Для власних OpenAI-сумісних endpoint або перевизначення типових значень провайдера:

| Ключ             | Тип      | Опис                                              |
| ---------------- | -------- | ------------------------------------------------- |
| `remote.baseUrl` | `string` | Власний базовий URL API                           |
| `remote.apiKey`  | `string` | Перевизначити API key                             |
| `remote.headers` | `object` | Додаткові HTTP-заголовки (об’єднуються з типовими значеннями провайдера) |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Конфігурація, специфічна для Gemini

| Ключ                   | Тип      | Типово                 | Опис                                         |
| ---------------------- | -------- | ---------------------- | -------------------------------------------- |
| `model`                | `string` | `gemini-embedding-001` | Також підтримує `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Для Embedding 2: 768, 1536 або 3072          |

<Warning>
Зміна `model` або `outputDimensionality` запускає автоматичне повне переіндексування.
</Warning>

---

## Конфігурація embedding Bedrock

Bedrock використовує типовий ланцюжок облікових даних AWS SDK -- API key не потрібні.
Якщо OpenClaw працює на EC2 із роллю екземпляра з увімкненим Bedrock, просто задайте
провайдера та модель:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0",
      },
    },
  },
}
```

| Ключ                   | Тип      | Типово                         | Опис                             |
| ---------------------- | -------- | ------------------------------ | -------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який ID embedding-моделі Bedrock |
| `outputDimensionality` | `number` | типове значення моделі         | Для Titan V2: 256, 512 або 1024  |

### Підтримувані моделі

Підтримуються такі моделі (із визначенням сімейства та типовими
розмірностями):

| ID моделі                                  | Провайдер  | Типові dims | Налаштовувані dims   |
| ------------------------------------------ | ---------- | ----------- | -------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024        | 256, 512, 1024       |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536        | --                   |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536        | --                   |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024        | --                   |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024        | 256, 384, 1024, 3072 |
| `cohere.embed-english-v3`                  | Cohere     | 1024        | --                   |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024        | --                   |
| `cohere.embed-v4:0`                        | Cohere     | 1536        | 256-1536             |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512         | --                   |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024        | --                   |

Варіанти із суфіксом пропускної здатності (наприклад, `amazon.titan-embed-text-v1:2:8k`) успадковують
конфігурацію базової моделі.

### Автентифікація

Автентифікація Bedrock використовує стандартний порядок визначення облікових даних AWS SDK:

1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Кеш токенів SSO
3. Облікові дані токена web identity
4. Спільні файли облікових даних і конфігурації
5. Облікові дані метаданих ECS або EC2

Регіон визначається з `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` провайдера
`amazon-bedrock`, або типово використовується `us-east-1`.

### Дозволи IAM

Ролі або користувачу IAM потрібно:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Для мінімально необхідних привілеїв обмежте `InvokeModel` конкретною моделлю:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Конфігурація локального embedding

| Ключ                  | Тип                | Типово                 | Опис                                                                                                                                                                                                                                                                                                           |
| --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath`     | `string`           | завантажується автоматично | Шлях до файлу моделі GGUF                                                                                                                                                                                                                                                                                   |
| `local.modelCacheDir` | `string`           | типове значення node-llama-cpp | Каталог кешу для завантажених моделей                                                                                                                                                                                                                                                                  |
| `local.contextSize`   | `number \| "auto"` | `4096`                 | Розмір вікна контексту для embedding-контексту. 4096 покриває типові фрагменти (128–512 токенів), одночасно обмежуючи non-weight VRAM. Зменште до 1024–2048 на обмежених хостах. `"auto"` використовує максимум, на якому навчалася модель — не рекомендовано для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів → ~32 GB VRAM проти ~8.8 GB при 4096). |

Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, завантажується автоматично).
Потрібна нативна збірка: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

Використовуйте окремий CLI, щоб перевірити той самий шлях провайдера, який використовує Gateway:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Якщо `provider` має значення `auto`, `local` вибирається лише тоді, коли `local.modelPath` вказує
на наявний локальний файл. Посилання на моделі `hf:` і HTTP(S) усе ще можна використовувати
явно з `provider: "local"`, але вони не змушують `auto` вибирати local
до того, як модель стане доступною на диску.

---

## Конфігурація гібридного пошуку

Усе розміщено в `memorySearch.query.hybrid`:

| Ключ                  | Тип       | Типово | Опис                               |
| --------------------- | --------- | ------ | ---------------------------------- |
| `enabled`             | `boolean` | `true` | Увімкнути гібридний пошук BM25 + vector |
| `vectorWeight`        | `number`  | `0.7`  | Вага для оцінок vector (0-1)       |
| `textWeight`          | `number`  | `0.3`  | Вага для оцінок BM25 (0-1)         |
| `candidateMultiplier` | `number`  | `4`    | Множник розміру пулу кандидатів    |

### MMR (різноманітність)

| Ключ          | Тип       | Типово | Опис                                   |
| ------------- | --------- | ------ | -------------------------------------- |
| `mmr.enabled` | `boolean` | `false` | Увімкнути rerank MMR                   |
| `mmr.lambda`  | `number`  | `0.7`  | 0 = максимальна різноманітність, 1 = максимальна релевантність |

### Часовий спад (свіжість)

| Ключ                         | Тип       | Типово | Опис                         |
| ---------------------------- | --------- | ------ | ---------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false` | Увімкнути підсилення свіжості |
| `temporalDecay.halfLifeDays` | `number`  | `30`   | Оцінка зменшується вдвічі кожні N днів |

Evergreen-файли (`MEMORY.md`, файли без дати в `memory/`) ніколи не піддаються спаду.

### Повний приклад

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Додаткові шляхи пам’яті

| Ключ        | Тип        | Опис                                        |
| ----------- | ---------- | ------------------------------------------- |
| `extraPaths` | `string[]` | Додаткові каталоги або файли для індексації |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

Шляхи можуть бути абсолютними або відносними до робочого простору. Каталоги скануються
рекурсивно на наявність файлів `.md`. Обробка symlink залежить від активного бекенда:
вбудований рушій ігнорує symlink, тоді як QMD наслідує поведінку сканера QMD.

Для пошуку transcript між агентами в межах агента використовуйте
`agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`.
Ці додаткові колекції мають ту саму форму `{ path, name, pattern? }`, але
об’єднуються для кожного агента та можуть зберігати явні спільні імена, коли шлях
вказує за межі поточного робочого простору.
Якщо той самий визначений шлях з’являється і в `memory.qmd.paths`, і в
`memorySearch.qmd.extraCollections`, QMD зберігає перший запис і пропускає
дублікат.

---

## Мультимодальна пам’ять (Gemini)

Індексуйте зображення та аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Ключ                      | Тип        | Типово     | Опис                                  |
| ------------------------- | ---------- | ---------- | ------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | Увімкнути мультимодальне індексування |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`, `["audio"]` або `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000` | Максимальний розмір файлу для індексації |

Застосовується лише до файлів у `extraPaths`. Типові корені пам’яті залишаються лише для Markdown.
Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш embedding

| Ключ               | Тип       | Типово | Опис                                  |
| ------------------ | --------- | ------ | ------------------------------------- |
| `cache.enabled`    | `boolean` | `false` | Кешувати embedding фрагментів у SQLite |
| `cache.maxEntries` | `number`  | `50000` | Максимальна кількість кешованих embedding |

Запобігає повторному embedding незмінного тексту під час переіндексації або оновлення transcript.

---

## Пакетне індексування

| Ключ                          | Тип       | Типово | Опис                       |
| ----------------------------- | --------- | ------ | -------------------------- |
| `remote.batch.enabled`        | `boolean` | `false` | Увімкнути API пакетного embedding |
| `remote.batch.concurrency`    | `number`  | `2`    | Паралельні пакетні завдання |
| `remote.batch.wait`           | `boolean` | `true` | Чекати завершення пакета   |
| `remote.batch.pollIntervalMs` | `number`  | --     | Інтервал опитування        |
| `remote.batch.timeoutMinutes` | `number`  | --     | Тайм-аут пакета            |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай
найшвидший і найдешевший для великих backfill.

---

## Пошук пам’яті сесій (експериментально)

Індексуйте transcript сесій і показуйте їх через `memory_search`:

| Ключ                          | Тип        | Типово       | Опис                                      |
| ----------------------------- | ---------- | ------------ | ----------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | Увімкнути індексацію сесій                |
| `sources`                     | `string[]` | `["memory"]` | Додайте `"sessions"`, щоб включити transcript |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | Поріг байтів для переіндексації           |
| `sync.sessions.deltaMessages` | `number`   | `50`         | Поріг повідомлень для переіндексації      |

Індексація сесій є opt-in і виконується асинхронно. Результати можуть бути
дещо застарілими. Логи сесій зберігаються на диску, тому межею довіри слід
вважати доступ до файлової системи.

---

## Прискорення vector у SQLite (sqlite-vec)

| Ключ                         | Тип       | Типово | Опис                                |
| ---------------------------- | --------- | ------ | ----------------------------------- |
| `store.vector.enabled`       | `boolean` | `true` | Використовувати sqlite-vec для vector-запитів |
| `store.vector.extensionPath` | `string`  | bundled | Перевизначити шлях до sqlite-vec    |

Коли sqlite-vec недоступний, OpenClaw автоматично повертається до cosine
similarity у процесі.

---

## Зберігання індексу

| Ключ                | Тип      | Типово                                | Опис                                          |
| ------------------- | -------- | ------------------------------------- | --------------------------------------------- |
| `store.path`        | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                         | Токенізатор FTS5 (`unicode61` або `trigram`)  |

---

## Конфігурація бекенда QMD

Установіть `memory.backend = "qmd"`, щоб увімкнути. Усі налаштування QMD розміщені в
`memory.qmd`:

| Ключ                     | Тип       | Типово   | Опис                                         |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`    | Шлях до виконуваного файлу QMD               |
| `searchMode`             | `string`  | `search` | Команда пошуку: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`   | Автоматично індексувати `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --       | Додаткові шляхи: `{ name, path, pattern? }`  |
| `sessions.enabled`       | `boolean` | `false`  | Індексувати transcript сесій                 |
| `sessions.retentionDays` | `number`  | --       | Retention transcript                         |
| `sessions.exportDir`     | `string`  | --       | Каталог експорту                             |

OpenClaw надає перевагу поточним формам колекцій і MCP-запитів QMD, але зберігає
сумісність зі старішими випусками QMD, повертаючись до застарілих прапорців колекцій `--mask`
і старіших назв інструментів MCP, коли це потрібно.

Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо вам потрібно
глобально перевизначити моделі QMD, установіть змінні середовища, наприклад
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у середовищі runtime
gateway.

### Розклад оновлення

| Ключ                      | Тип       | Типово  | Опис                                 |
| ------------------------- | --------- | ------- | ------------------------------------ |
| `update.interval`         | `string`  | `5m`    | Інтервал оновлення                   |
| `update.debounceMs`       | `number`  | `15000` | Debounce змін у файлах               |
| `update.onBoot`           | `boolean` | `true`  | Оновлювати під час запуску           |
| `update.waitForBootSync`  | `boolean` | `false` | Блокувати запуск до завершення оновлення |
| `update.embedInterval`    | `string`  | --      | Окрема частота embedding             |
| `update.commandTimeoutMs` | `number`  | --      | Тайм-аут для команд QMD              |
| `update.updateTimeoutMs`  | `number`  | --      | Тайм-аут для операцій оновлення QMD  |
| `update.embedTimeoutMs`   | `number`  | --      | Тайм-аут для операцій embedding QMD  |

### Обмеження

| Ключ                      | Тип      | Типово | Опис                           |
| ------------------------- | -------- | ------ | ------------------------------ |
| `limits.maxResults`       | `number` | `6`    | Максимум результатів пошуку    |
| `limits.maxSnippetChars`  | `number` | --     | Обмежити довжину сніпета       |
| `limits.maxInjectedChars` | `number` | --     | Обмежити загальну кількість інжектованих символів |
| `limits.timeoutMs`        | `number` | `4000` | Тайм-аут пошуку                |

### Область дії

Керує тим, які сесії можуть отримувати результати пошуку QMD. Та сама схема, що й у
[`session.sendPolicy`](/uk/gateway/config-agents#session):

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Типове постачене значення дозволяє прямі сесії та сесії каналів, водночас усе ще забороняючи
групи.

Типово дозволені лише приватні повідомлення. `match.keyPrefix` зіставляється з нормалізованим ключем сесії;
`match.rawKeyPrefix` зіставляється з сирим ключем, включно з `agent:<id>:`.

### Цитування

`memory.citations` застосовується до всіх бекендів:

| Значення        | Поведінка                                         |
| --------------- | ------------------------------------------------- |
| `auto` (типово) | Додавати нижній колонтитул `Source: <path#line>` у сніпети |
| `on`            | Завжди додавати нижній колонтитул                 |
| `off`           | Не додавати нижній колонтитул (шлях усе одно передається агенту всередині) |

### Повний приклад QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming налаштовується в `plugins.entries.memory-core.config.dreaming`,
а не в `agents.defaults.memorySearch`.

Dreaming запускається як один запланований прохід і використовує внутрішні фази light/deep/REM як
деталь реалізації.

Для концептуальної поведінки та slash-команд див. [Dreaming](/uk/concepts/dreaming).

### Налаштування користувача

| Ключ       | Тип       | Типово      | Опис                                          |
| ---------- | --------- | ----------- | --------------------------------------------- |
| `enabled`  | `boolean` | `false`     | Повністю ввімкнути або вимкнути Dreaming      |
| `frequency` | `string` | `0 3 * * *` | Необов’язкова Cron-частота для повного проходу Dreaming |

### Приклад

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

Примітки:

- Dreaming записує машинний стан у `memory/.dreams/`.
- Dreaming записує людинозрозумілий наративний вивід у `DREAMS.md` (або наявний `dreams.md`).
- Політика фаз light/deep/REM і пороги є внутрішньою поведінкою, а не користувацькою конфігурацією.

## Пов’язане

- [Memory overview](/uk/concepts/memory)
- [Memory search](/uk/concepts/memory-search)
- [Configuration reference](/uk/gateway/configuration-reference)
