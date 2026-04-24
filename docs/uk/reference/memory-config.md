---
read_when:
    - Ви хочете налаштувати провайдерів пошуку в пам’яті або моделі embedding
    - Ви хочете налаштувати бекенд QMD
    - Ви хочете налаштувати гібридний пошук, MMR або часове згасання
    - Ви хочете ввімкнути мультимодальне індексування пам’яті
summary: Усі параметри конфігурації для пошуку в пам’яті, провайдерів embedding, QMD, гібридного пошуку та мультимодальної індексації
title: Довідник з конфігурації пам’яті
x-i18n:
    generated_at: "2026-04-24T03:20:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2f787657d1841e1674fd2e415301124d471342921cfc62474cd9392e00c9b69a
    source_path: reference/memory-config.md
    workflow: 15
---

На цій сторінці перелічено всі параметри конфігурації для пошуку в пам’яті OpenClaw. Для
концептуальних оглядів див.:

- [Огляд пам’яті](/uk/concepts/memory) -- як працює пам’ять
- [Вбудований рушій](/uk/concepts/memory-builtin) -- типовий бекенд SQLite
- [Рушій QMD](/uk/concepts/memory-qmd) -- локальний sidecar
- [Пошук у пам’яті](/uk/concepts/memory-search) -- конвеєр пошуку та налаштування
- [Active Memory](/uk/concepts/active-memory) -- увімкнення субагента пам’яті для інтерактивних сесій

Усі налаштування пошуку в пам’яті розміщені в `agents.defaults.memorySearch` у
`openclaw.json`, якщо не зазначено інше.

Якщо ви шукаєте перемикач функції **Active Memory** і конфігурацію субагента,
вони розміщені в `plugins.entries.active-memory`, а не в `memorySearch`.

Active Memory використовує двоступеневу модель:

1. Plugin має бути увімкнений і націлений на поточний id агента
2. запит має бути придатною інтерактивною постійною chat-сесією

Див. [Active Memory](/uk/concepts/active-memory) щодо моделі активації,
конфігурації, яка належить Plugin, збереження transcript і безпечного шаблону розгортання.

---

## Вибір провайдера

| Ключ | Тип | За замовчуванням | Опис |
| ---------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| `provider` | `string` | автоматичне визначення | ID адаптера embedding: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model` | `string` | типове значення провайдера | Назва моделі embedding |
| `fallback` | `string` | `"none"` | ID резервного адаптера, якщо основний завершується з помилкою |
| `enabled` | `boolean` | `true` | Увімкнути або вимкнути пошук у пам’яті |

### Порядок автоматичного визначення

Коли `provider` не задано, OpenClaw вибирає перший доступний:

1. `local` -- якщо налаштовано `memorySearch.local.modelPath` і файл існує.
2. `github-copilot` -- якщо токен GitHub Copilot можна зіставити (змінна env або профіль auth).
3. `openai` -- якщо можна зіставити ключ OpenAI.
4. `gemini` -- якщо можна зіставити ключ Gemini.
5. `voyage` -- якщо можна зіставити ключ Voyage.
6. `mistral` -- якщо можна зіставити ключ Mistral.
7. `bedrock` -- якщо ланцюг облікових даних AWS SDK успішно зіставляється (роль екземпляра, ключі доступу, профіль, SSO, web identity або спільна конфігурація).

`ollama` підтримується, але не визначається автоматично (задайте його явно).

### Зіставлення API-ключа

Віддалені embedding потребують API-ключа. Bedrock натомість використовує типовий
ланцюг облікових даних AWS SDK (ролі екземпляра, SSO, ключі доступу).

| Провайдер | Змінна env | Ключ конфігурації |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock | ланцюг облікових даних AWS | API-ключ не потрібен |
| Gemini | `GEMINI_API_KEY` | `models.providers.google.apiKey` |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Профіль auth через вхід пристрою |
| Mistral | `MISTRAL_API_KEY` | `models.providers.mistral.apiKey` |
| Ollama | `OLLAMA_API_KEY` (заповнювач) | -- |
| OpenAI | `OPENAI_API_KEY` | `models.providers.openai.apiKey` |
| Voyage | `VOYAGE_API_KEY` | `models.providers.voyage.apiKey` |

OAuth Codex покриває лише chat/completions і не задовольняє запити
embedding.

---

## Конфігурація віддаленої кінцевої точки

Для користувацьких OpenAI-сумісних кінцевих точок або перевизначення типових значень провайдера:

| Ключ | Тип | Опис |
| ---------------- | -------- | -------------------------------------------------- |
| `remote.baseUrl` | `string` | Користувацький базовий URL API |
| `remote.apiKey` | `string` | Перевизначити API-ключ |
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

| Ключ | Тип | За замовчуванням | Опис |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model` | `string` | `gemini-embedding-001` | Також підтримує `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072` | Для Embedding 2: 768, 1536 або 3072 |

<Warning>
Зміна `model` або `outputDimensionality` запускає автоматичне повне переіндексування.
</Warning>

---

## Конфігурація embedding Bedrock

Bedrock використовує типовий ланцюг облікових даних AWS SDK -- API-ключі не потрібні.
Якщо OpenClaw запущено на EC2 з роллю екземпляра з увімкненим Bedrock, просто задайте
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

| Ключ | Тип | За замовчуванням | Опис |
| ---------------------- | -------- | ------------------------------ | ------------------------------- |
| `model` | `string` | `amazon.titan-embed-text-v2:0` | Будь-який ID моделі embedding Bedrock |
| `outputDimensionality` | `number` | типове значення моделі | Для Titan V2: 256, 512 або 1024 |

### Підтримувані моделі

Підтримуються такі моделі (з визначенням сімейства та типовими
розмірностями):

| ID моделі | Провайдер | Типові розмірності | Налаштовувані розмірності |
| ------------------------------------------ | ---------- | ------------ | -------------------- |
| `amazon.titan-embed-text-v2:0` | Amazon | 1024 | 256, 512, 1024 |
| `amazon.titan-embed-text-v1` | Amazon | 1536 | -- |
| `amazon.titan-embed-g1-text-02` | Amazon | 1536 | -- |
| `amazon.titan-embed-image-v1` | Amazon | 1024 | -- |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon | 1024 | 256, 384, 1024, 3072 |
| `cohere.embed-english-v3` | Cohere | 1024 | -- |
| `cohere.embed-multilingual-v3` | Cohere | 1024 | -- |
| `cohere.embed-v4:0` | Cohere | 1536 | 256-1536 |
| `twelvelabs.marengo-embed-3-0-v1:0` | TwelveLabs | 512 | -- |
| `twelvelabs.marengo-embed-2-7-v1:0` | TwelveLabs | 1024 | -- |

Варіанти з суфіксами пропускної здатності (наприклад, `amazon.titan-embed-text-v1:2:8k`) успадковують
конфігурацію базової моделі.

### Автентифікація

Auth Bedrock використовує стандартний порядок зіставлення облікових даних AWS SDK:

1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Кеш токенів SSO
3. Облікові дані токена web identity
4. Спільні файли облікових даних і конфігурації
5. Облікові дані метаданих ECS або EC2

Регіон зіставляється з `AWS_REGION`, `AWS_DEFAULT_REGION`,
`baseUrl` провайдера `amazon-bedrock` або типово `us-east-1`.

### Дозволи IAM

Роль або користувач IAM потребує:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Для мінімально необхідних дозволів обмежте `InvokeModel` конкретною моделлю:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Конфігурація локального embedding

| Ключ | Тип | За замовчуванням | Опис |
| --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath` | `string` | автоматично завантажується | Шлях до файла моделі GGUF |
| `local.modelCacheDir` | `string` | типове значення node-llama-cpp | Каталог кешу для завантажених моделей |
| `local.contextSize` | `number \| "auto"` | `4096` | Розмір вікна контексту для embedding-контексту. 4096 покриває типові фрагменти (128–512 токенів), обмежуючи при цьому VRAM, не пов’язану з вагами. На обмежених хостах зменште до 1024–2048. `"auto"` використовує натренований максимум моделі — не рекомендується для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів → ~32 ГБ VRAM проти ~8.8 ГБ при 4096). |

Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 ГБ, завантажується автоматично).
Потребує нативного збирання: `pnpm approve-builds`, а потім `pnpm rebuild node-llama-cpp`.

Використовуйте окремий CLI, щоб перевірити той самий шлях провайдера, який використовує Gateway:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Якщо `provider` має значення `auto`, `local` вибирається лише тоді, коли `local.modelPath` вказує
на наявний локальний файл. Посилання на моделі `hf:` і HTTP(S) все ще можна використовувати
явно з `provider: "local"`, але вони не змушують `auto` вибирати local
до того, як модель стане доступною на диску.

---

## Конфігурація гібридного пошуку

Усе в `memorySearch.query.hybrid`:

| Ключ | Тип | За замовчуванням | Опис |
| --------------------- | --------- | ------- | ---------------------------------- |
| `enabled` | `boolean` | `true` | Увімкнути гібридний пошук BM25 + vector |
| `vectorWeight` | `number` | `0.7` | Вага для оцінок vector (0-1) |
| `textWeight` | `number` | `0.3` | Вага для оцінок BM25 (0-1) |
| `candidateMultiplier` | `number` | `4` | Множник розміру пулу кандидатів |

### MMR (різноманітність)

| Ключ | Тип | За замовчуванням | Опис |
| ------------- | --------- | ------- | ------------------------------------ |
| `mmr.enabled` | `boolean` | `false` | Увімкнути MMR reranking |
| `mmr.lambda` | `number` | `0.7` | 0 = максимум різноманітності, 1 = максимум релевантності |

### Часове згасання (актуальність)

| Ключ | Тип | За замовчуванням | Опис |
| ---------------------------- | --------- | ------- | ------------------------- |
| `temporalDecay.enabled` | `boolean` | `false` | Увімкнути підсилення актуальності |
| `temporalDecay.halfLifeDays` | `number` | `30` | Оцінка зменшується вдвічі кожні N днів |

Файли Evergreen (`MEMORY.md`, файли без дати в `memory/`) ніколи не піддаються згасанню.

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

| Ключ | Тип | Опис |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | Додаткові каталоги або файли для індексування |

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
рекурсивно на наявність файлів `.md`. Обробка symlink залежить від активного бекенду:
вбудований рушій ігнорує symlink, тоді як QMD наслідує поведінку сканера QMD,
що лежить в основі.

Для пошуку transcript між агентами в межах області агента використовуйте
`agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`.
Ці додаткові колекції мають ту саму форму `{ path, name, pattern? }`, але
об’єднуються для кожного агента й можуть зберігати явні спільні назви, коли шлях
вказує поза межі поточного робочого простору.
Якщо той самий зіставлений шлях з’являється і в `memory.qmd.paths`, і в
`memorySearch.qmd.extraCollections`, QMD зберігає перший запис і пропускає
дублікат.

---

## Мультимодальна пам’ять (Gemini)

Індексуйте зображення й аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Ключ | Тип | За замовчуванням | Опис |
| ------------------------- | ---------- | ---------- | -------------------------------------- |
| `multimodal.enabled` | `boolean` | `false` | Увімкнути мультимодальне індексування |
| `multimodal.modalities` | `string[]` | -- | `["image"]`, `["audio"]` або `["all"]` |
| `multimodal.maxFileBytes` | `number` | `10000000` | Максимальний розмір файла для індексування |

Застосовується лише до файлів у `extraPaths`. Типові корені пам’яті й далі залишаються лише для Markdown.
Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш embedding

| Ключ | Тип | За замовчуванням | Опис |
| ------------------ | --------- | ------- | -------------------------------- |
| `cache.enabled` | `boolean` | `false` | Кешувати embedding фрагментів у SQLite |
| `cache.maxEntries` | `number` | `50000` | Максимальна кількість кешованих embedding |

Запобігає повторному embedding незмінного тексту під час переіндексації або оновлень transcript.

---

## Пакетне індексування

| Ключ | Тип | За замовчуванням | Опис |
| ----------------------------- | --------- | ------- | -------------------------- |
| `remote.batch.enabled` | `boolean` | `false` | Увімкнути API пакетного embedding |
| `remote.batch.concurrency` | `number` | `2` | Паралельні пакетні завдання |
| `remote.batch.wait` | `boolean` | `true` | Очікувати завершення пакета |
| `remote.batch.pollIntervalMs` | `number` | -- | Інтервал опитування |
| `remote.batch.timeoutMinutes` | `number` | -- | Тайм-аут пакета |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай
найшвидший і найдешевший для великих зворотних заповнень.

---

## Пошук у пам’яті сесій (експериментально)

Індексуйте transcript сесій і відкривайте їх через `memory_search`:

| Ключ | Тип | За замовчуванням | Опис |
| ----------------------------- | ---------- | ------------ | --------------------------------------- |
| `experimental.sessionMemory` | `boolean` | `false` | Увімкнути індексування сесій |
| `sources` | `string[]` | `["memory"]` | Додайте `"sessions"`, щоб включити transcript |
| `sync.sessions.deltaBytes` | `number` | `100000` | Поріг байтів для переіндексації |
| `sync.sessions.deltaMessages` | `number` | `50` | Поріг повідомлень для переіндексації |

Індексування сесій є опціональним і виконується асинхронно. Результати можуть бути
дещо застарілими. Журнали сесій зберігаються на диску, тому вважайте доступ до файлової системи
межею довіри.

---

## Прискорення SQLite vector (sqlite-vec)

| Ключ | Тип | За замовчуванням | Опис |
| ---------------------------- | --------- | ------- | --------------------------------- |
| `store.vector.enabled` | `boolean` | `true` | Використовувати sqlite-vec для vector-запитів |
| `store.vector.extensionPath` | `string` | вбудовано | Перевизначити шлях до sqlite-vec |

Коли sqlite-vec недоступний, OpenClaw автоматично повертається до in-process
cosine similarity.

---

## Зберігання індексу

| Ключ | Тип | За замовчуванням | Опис |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path` | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61` | Токенізатор FTS5 (`unicode61` або `trigram`) |

---

## Конфігурація бекенду QMD

Установіть `memory.backend = "qmd"`, щоб увімкнути його. Усі налаштування QMD розміщені в
`memory.qmd`:

| Ключ | Тип | За замовчуванням | Опис |
| ------------------------ | --------- | -------- | -------------------------------------------- |
| `command` | `string` | `qmd` | Шлях до виконуваного файла QMD |
| `searchMode` | `string` | `search` | Команда пошуку: `search`, `vsearch`, `query` |
| `includeDefaultMemory` | `boolean` | `true` | Автоматично індексувати `MEMORY.md` + `memory/**/*.md` |
| `paths[]` | `array` | -- | Додаткові шляхи: `{ name, path, pattern? }` |
| `sessions.enabled` | `boolean` | `false` | Індексувати transcript сесій |
| `sessions.retentionDays` | `number` | -- | Термін зберігання transcript |
| `sessions.exportDir` | `string` | -- | Каталог експорту |

OpenClaw віддає перевагу поточним формам колекцій QMD і запитів MCP, але зберігає
сумісність зі старими релізами QMD, повертаючись за потреби до застарілих прапорців колекцій `--mask`
і старіших назв інструментів MCP.

Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо вам потрібно
глобально перевизначити моделі QMD, задайте змінні середовища, такі як
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у середовищі runtime
gateway.

### Розклад оновлення

| Ключ | Тип | За замовчуванням | Опис |
| ------------------------- | --------- | ------- | ------------------------------------- |
| `update.interval` | `string` | `5m` | Інтервал оновлення |
| `update.debounceMs` | `number` | `15000` | Debounce змін файлів |
| `update.onBoot` | `boolean` | `true` | Оновлювати під час запуску |
| `update.waitForBootSync` | `boolean` | `false` | Блокувати запуск до завершення оновлення |
| `update.embedInterval` | `string` | -- | Окрема частота embedding |
| `update.commandTimeoutMs` | `number` | -- | Тайм-аут для команд QMD |
| `update.updateTimeoutMs` | `number` | -- | Тайм-аут для операцій оновлення QMD |
| `update.embedTimeoutMs` | `number` | -- | Тайм-аут для операцій embedding QMD |

### Ліміти

| Ключ | Тип | За замовчуванням | Опис |
| ------------------------- | -------- | ------- | -------------------------- |
| `limits.maxResults` | `number` | `6` | Максимум результатів пошуку |
| `limits.maxSnippetChars` | `number` | -- | Обмежити довжину snippet |
| `limits.maxInjectedChars` | `number` | -- | Обмежити загальну кількість вставлених символів |
| `limits.timeoutMs` | `number` | `4000` | Тайм-аут пошуку |

### Область

Керує тим, які сесії можуть отримувати результати пошуку QMD. Та сама схема, що й у
[`session.sendPolicy`](/uk/gateway/configuration-reference#session):

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

Типове постачальне налаштування дозволяє прямі сесії й сесії каналів, водночас і далі забороняючи
групи.

Типове значення — лише DM. `match.keyPrefix` зіставляється з нормалізованим ключем сесії;
`match.rawKeyPrefix` зіставляється з сирим ключем, включно з `agent:<id>:`.

### Цитати

`memory.citations` застосовується до всіх бекендів:

| Значення | Поведінка |
| ---------------- | --------------------------------------------------- |
| `auto` (типово) | Додавати в snippet нижній колонтитул `Source: <path#line>` |
| `on` | Завжди додавати нижній колонтитул |
| `off` | Не додавати нижній колонтитул (шлях усе одно внутрішньо передається агенту) |

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

Dreaming виконується як один запланований прохід і використовує внутрішні фази light/deep/REM як
деталь реалізації.

Щодо концептуальної поведінки та slash-команд див. [Dreaming](/uk/concepts/dreaming).

### Користувацькі налаштування

| Ключ | Тип | За замовчуванням | Опис |
| ----------- | --------- | ----------- | ------------------------------------------------- |
| `enabled` | `boolean` | `false` | Повністю ввімкнути або вимкнути Dreaming |
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
- Dreaming записує людиночитаний наративний вивід у `DREAMS.md` (або наявний `dreams.md`).
- Політика й пороги фаз light/deep/REM є внутрішньою поведінкою, а не користувацькою конфігурацією.

## Пов’язане

- [Огляд пам’яті](/uk/concepts/memory)
- [Пошук у пам’яті](/uk/concepts/memory-search)
- [Довідник із конфігурації](/uk/gateway/configuration-reference)
