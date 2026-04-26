---
read_when:
    - Ви хочете налаштувати постачальників пошуку в пам’яті або моделі embeddings
    - Ви хочете налаштувати бекенд QMD
    - Ви хочете налаштувати гібридний пошук, MMR або часовий спад
    - Ви хочете ввімкнути мультимодальне індексування пам’яті
sidebarTitle: Memory config
summary: Усі параметри конфігурації для пошуку в пам’яті, постачальників embeddings, QMD, гібридного пошуку та мультимодального індексування
title: Довідник із конфігурації пам’яті
x-i18n:
    generated_at: "2026-04-26T07:51:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fd747abc6d0d43cfc869faa0b5e6c1618681ef3b02068207321d60d449a901
    source_path: reference/memory-config.md
    workflow: 15
---

На цій сторінці перелічено всі параметри конфігурації для пошуку в пам’яті OpenClaw. Концептуальні огляди див. тут:

<CardGroup cols={2}>
  <Card title="Memory overview" href="/uk/concepts/memory">
    Як працює пам’ять.
  </Card>
  <Card title="Builtin engine" href="/uk/concepts/memory-builtin">
    Типовий бекенд SQLite.
  </Card>
  <Card title="QMD engine" href="/uk/concepts/memory-qmd">
    Local-first sidecar.
  </Card>
  <Card title="Memory search" href="/uk/concepts/memory-search">
    Конвеєр пошуку та налаштування.
  </Card>
  <Card title="Active memory" href="/uk/concepts/active-memory">
    Підагент пам’яті для інтерактивних сесій.
  </Card>
</CardGroup>

Усі налаштування пошуку в пам’яті розміщені в `agents.defaults.memorySearch` у `openclaw.json`, якщо не вказано інше.

<Note>
Якщо ви шукаєте перемикач функції **Active Memory** і конфігурацію підагента, вони розміщені в `plugins.entries.active-memory`, а не в `memorySearch`.

Active Memory використовує модель із двома умовами:

1. Plugin має бути увімкнений і націлений на поточний id агента
2. запит має бути відповідною інтерактивною постійною сесією чату

Модель активації, конфігурацію, якою володіє Plugin, збереження transcript і безпечний шаблон розгортання див. у [Active Memory](/uk/concepts/active-memory).
</Note>

---

## Вибір постачальника

| Ключ      | Тип       | Типове значення | Опис                                                                                                            |
| ---------- | --------- | ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | визначається автоматично | Id адаптера embeddings: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | типове значення постачальника | Назва моделі embeddings                                                                                         |
| `fallback` | `string`  | `"none"`         | Id запасного адаптера, якщо основний завершується помилкою                                                     |
| `enabled`  | `boolean` | `true`           | Увімкнути або вимкнути пошук у пам’яті                                                                          |

### Порядок автовизначення

Коли `provider` не задано, OpenClaw вибирає перший доступний:

<Steps>
  <Step title="local">
    Вибирається, якщо налаштовано `memorySearch.local.modelPath` і файл існує.
  </Step>
  <Step title="github-copilot">
    Вибирається, якщо можна визначити токен GitHub Copilot (env var або профіль auth).
  </Step>
  <Step title="openai">
    Вибирається, якщо можна визначити ключ OpenAI.
  </Step>
  <Step title="gemini">
    Вибирається, якщо можна визначити ключ Gemini.
  </Step>
  <Step title="voyage">
    Вибирається, якщо можна визначити ключ Voyage.
  </Step>
  <Step title="mistral">
    Вибирається, якщо можна визначити ключ Mistral.
  </Step>
  <Step title="bedrock">
    Вибирається, якщо ланцюжок облікових даних AWS SDK успішно визначається (роль інстанса, ключі доступу, профіль, SSO, вебідентичність або спільна конфігурація).
  </Step>
</Steps>

`ollama` підтримується, але не визначається автоматично (задайте його явно).

### Визначення API-ключа

Для віддалених embeddings потрібен API-ключ. Натомість Bedrock використовує типовий ланцюжок облікових даних AWS SDK (ролі інстанса, SSO, ключі доступу).

| Постачальник   | Env var                                            | Ключ конфігурації                 |
| -------------- | -------------------------------------------------- | --------------------------------- |
| Bedrock        | ланцюжок облікових даних AWS                       | API-ключ не потрібен              |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`  |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Профіль auth через вхід за device login |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey` |
| Ollama         | `OLLAMA_API_KEY` (заповнювач)                      | --                                |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`  |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`  |

<Note>
Codex OAuth покриває лише chat/completions і не підходить для запитів embeddings.
</Note>

---

## Конфігурація віддаленого endpoint

Для власних OpenAI-compatible endpoint-ів або перевизначення типових значень постачальника:

<ParamField path="remote.baseUrl" type="string">
  Власна базова URL-адреса API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Перевизначення API-ключа.
</ParamField>
<ParamField path="remote.headers" type="object">
  Додаткові HTTP headers (зливаються з типовими значеннями постачальника).
</ParamField>

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

## Конфігурація, специфічна для постачальника

<AccordionGroup>
  <Accordion title="Gemini">
    | Ключ                   | Тип      | Типове значення       | Опис                                       |
    | ---------------------- | -------- | --------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Також підтримує `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                | Для Embedding 2: 768, 1536 або 3072        |

    <Warning>
    Зміна `model` або `outputDimensionality` запускає автоматичне повне переіндексування.
    </Warning>

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock використовує типовий ланцюжок облікових даних AWS SDK — API-ключі не потрібні. Якщо OpenClaw працює на EC2 з роллю інстанса Bedrock, достатньо задати постачальника й модель:

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

    | Ключ                   | Тип      | Типове значення               | Опис                              |
    | ---------------------- | -------- | ----------------------------- | --------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Будь-який id моделі embeddings Bedrock |
    | `outputDimensionality` | `number` | типове значення моделі        | Для Titan V2: 256, 512 або 1024   |

    **Підтримувані моделі** (з визначенням сімейства й типовими розмірностями):

    | Model ID                                   | Постачальник | Типові розмірності | Налаштовувані розмірності |
    | ------------------------------------------ | ------------ | ------------------ | ------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon       | 1024               | 256, 512, 1024            |
    | `amazon.titan-embed-text-v1`               | Amazon       | 1536               | --                        |
    | `amazon.titan-embed-g1-text-02`            | Amazon       | 1536               | --                        |
    | `amazon.titan-embed-image-v1`              | Amazon       | 1024               | --                        |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon       | 1024               | 256, 384, 1024, 3072      |
    | `cohere.embed-english-v3`                  | Cohere       | 1024               | --                        |
    | `cohere.embed-multilingual-v3`             | Cohere       | 1024               | --                        |
    | `cohere.embed-v4:0`                        | Cohere       | 1536               | 256-1536                  |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs   | 512                | --                        |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs   | 1024               | --                        |

    Варіанти з суфіксом пропускної здатності (наприклад, `amazon.titan-embed-text-v1:2:8k`) успадковують конфігурацію базової моделі.

    **Автентифікація:** auth Bedrock використовує стандартний порядок визначення облікових даних AWS SDK:

    1. Змінні середовища (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Кеш токенів SSO
    3. Облікові дані токена вебідентичності
    4. Спільні файли облікових даних і конфігурації
    5. Облікові дані метаданих ECS або EC2

    Регіон визначається з `AWS_REGION`, `AWS_DEFAULT_REGION`, `baseUrl` постачальника `amazon-bedrock` або типово з `us-east-1`.

    **Дозволи IAM:** ролі або користувачу IAM потрібен такий дозвіл:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Для принципу найменших привілеїв обмежте `InvokeModel` конкретною моделлю:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Ключ                  | Тип                | Типове значення         | Опис                                                                                                                                                                                                                                                                                                             |
    | --------------------- | ------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | завантажується автоматично | Шлях до файлу моделі GGUF                                                                                                                                                                                                                                                                                       |
    | `local.modelCacheDir` | `string`           | типове значення node-llama-cpp | Каталог кешу для завантажених моделей                                                                                                                                                                                                                                                                           |
    | `local.contextSize`   | `number \| "auto"` | `4096`                  | Розмір контекстного вікна для контексту embeddings. 4096 покриває типові фрагменти (128–512 токенів) і водночас обмежує VRAM, не пов’язану з вагами. Зменшуйте до 1024–2048 на обмежених хостах. `"auto"` використовує навчений максимум моделі — не рекомендовано для моделей 8B+ (Qwen3-Embedding-8B: 40 960 токенів → ~32 ГБ VRAM проти ~8.8 ГБ при 4096). |

    Типова модель: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 ГБ, завантажується автоматично). Потрібне нативне збирання: `pnpm approve-builds`, потім `pnpm rebuild node-llama-cpp`.

    Використовуйте окремий CLI, щоб перевірити той самий шлях постачальника, який використовує Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Якщо `provider` має значення `auto`, `local` вибирається лише тоді, коли `local.modelPath` вказує на наявний локальний файл. Посилання на модель `hf:` і HTTP(S) усе ще можна явно використовувати з `provider: "local"`, але вони не змушують `auto` вибрати local до того, як модель стане доступною на диску.

  </Accordion>
</AccordionGroup>

### Вбудований тайм-аут embeddings

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Перевизначає тайм-аут для вбудованих пакетів embeddings під час індексування пам’яті.

Якщо не задано, використовується типове значення постачальника: 600 секунд для локальних/self-hosted постачальників, як-от `local`, `ollama` і `lmstudio`, і 120 секунд для розміщених постачальників. Збільшуйте це значення, якщо локальні пакети embeddings, обмежені CPU, працюють коректно, але повільно.
</ParamField>

---

## Конфігурація гібридного пошуку

Усе знаходиться в `memorySearch.query.hybrid`:

| Ключ                  | Тип       | Типове значення | Опис                               |
| --------------------- | --------- | --------------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`          | Увімкнути гібридний пошук BM25 + векторний пошук |
| `vectorWeight`        | `number`  | `0.7`           | Вага для векторних оцінок (0-1)    |
| `textWeight`          | `number`  | `0.3`           | Вага для оцінок BM25 (0-1)         |
| `candidateMultiplier` | `number`  | `4`             | Множник розміру пулу кандидатів    |

<Tabs>
  <Tab title="MMR (різноманітність)">
    | Ключ          | Тип       | Типове значення | Опис                                 |
    | ------------- | --------- | --------------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false`         | Увімкнути повторне ранжування MMR    |
    | `mmr.lambda`  | `number`  | `0.7`           | 0 = максимальна різноманітність, 1 = максимальна релевантність |
  </Tab>
  <Tab title="Temporal decay (актуальність)">
    | Ключ                         | Тип       | Типове значення | Опис                             |
    | ---------------------------- | --------- | --------------- | -------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`         | Увімкнути підсилення актуальності |
    | `temporalDecay.halfLifeDays` | `number`  | `30`            | Оцінка зменшується вдвічі кожні N днів |

    Для файлів тривалого значення (`MEMORY.md`, файли без дати в `memory/`) часовий спад ніколи не застосовується.

  </Tab>
</Tabs>

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

| Ключ        | Тип        | Опис                                   |
| ----------- | ---------- | -------------------------------------- |
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

Шляхи можуть бути абсолютними або відносними до workspace. Каталоги скануються рекурсивно на наявність файлів `.md`. Обробка symlink залежить від активного бекенда: вбудований engine ігнорує symlink, тоді як QMD дотримується поведінки базового сканера QMD.

Для пошуку transcript між агентами в межах агента використовуйте `agents.list[].memorySearch.qmd.extraCollections` замість `memory.qmd.paths`. Ці додаткові колекції мають ту саму форму `{ path, name, pattern? }`, але зливаються для кожного агента окремо й можуть зберігати явні спільні назви, коли шлях указує за межі поточного workspace. Якщо той самий визначений шлях з’являється і в `memory.qmd.paths`, і в `memorySearch.qmd.extraCollections`, QMD зберігає перший запис і пропускає дублікат.

---

## Мультимодальна пам’ять (Gemini)

Індексуйте зображення й аудіо разом із Markdown за допомогою Gemini Embedding 2:

| Ключ                      | Тип        | Типове значення | Опис                                 |
| ------------------------- | ---------- | --------------- | ------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`         | Увімкнути мультимодальну індексацію  |
| `multimodal.modalities`   | `string[]` | --              | `["image"]`, `["audio"]` або `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000`      | Максимальний розмір файлу для індексації |

<Note>
Застосовується лише до файлів у `extraPaths`. Типові корені пам’яті залишаються лише для Markdown. Потрібен `gemini-embedding-2-preview`. `fallback` має бути `"none"`.
</Note>

Підтримувані формати: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (зображення); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (аудіо).

---

## Кеш embeddings

| Ключ               | Тип       | Типове значення | Опис                              |
| ------------------ | --------- | --------------- | --------------------------------- |
| `cache.enabled`    | `boolean` | `false`         | Кешувати embeddings фрагментів у SQLite |
| `cache.maxEntries` | `number`  | `50000`         | Максимальна кількість кешованих embeddings |

Запобігає повторному створенню embeddings для незміненого тексту під час переіндексації або оновлення transcript.

---

## Пакетна індексація

| Ключ                          | Тип       | Типове значення | Опис                         |
| ----------------------------- | --------- | --------------- | ---------------------------- |
| `remote.batch.enabled`        | `boolean` | `false`         | Увімкнути пакетний API embeddings |
| `remote.batch.concurrency`    | `number`  | `2`             | Паралельні пакетні завдання  |
| `remote.batch.wait`           | `boolean` | `true`          | Очікувати завершення пакета  |
| `remote.batch.pollIntervalMs` | `number`  | --              | Інтервал опитування          |
| `remote.batch.timeoutMinutes` | `number`  | --              | Тайм-аут пакета              |

Доступно для `openai`, `gemini` і `voyage`. Пакетний режим OpenAI зазвичай найшвидший і найдешевший для великих зворотних заповнень.

Це окремо від `sync.embeddingBatchTimeoutSeconds`, який керує вбудованими викликами embeddings, що використовуються локальними/self-hosted постачальниками та розміщеними постачальниками, коли пакетні API постачальника не активні.

---

## Пошук пам’яті сесії (експериментально)

Індексуйте transcripts сесій і відкривайте їх через `memory_search`:

| Ключ                         | Тип        | Типове значення | Опис                                  |
| ---------------------------- | ---------- | --------------- | ------------------------------------- |
| `experimental.sessionMemory` | `boolean`  | `false`         | Увімкнути індексацію сесій            |
| `sources`                    | `string[]` | `["memory"]`    | Додайте `"sessions"`, щоб включити transcripts |
| `sync.sessions.deltaBytes`   | `number`   | `100000`        | Поріг байтів для переіндексації       |
| `sync.sessions.deltaMessages`| `number`   | `50`            | Поріг повідомлень для переіндексації  |

<Warning>
Індексація сесій вмикається за бажанням і виконується асинхронно. Результати можуть бути трохи застарілими. Журнали сесій зберігаються на диску, тому вважайте доступ до файлової системи межею довіри.
</Warning>

---

## Прискорення векторів SQLite (sqlite-vec)

| Ключ                         | Тип       | Типове значення | Опис                                |
| ---------------------------- | --------- | --------------- | ----------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`          | Використовувати sqlite-vec для векторних запитів |
| `store.vector.extensionPath` | `string`  | bundled         | Перевизначити шлях до sqlite-vec    |

Коли sqlite-vec недоступний, OpenClaw автоматично повертається до косинусної подібності в межах процесу.

---

## Зберігання індексу

| Ключ                 | Тип      | Типове значення                       | Опис                                        |
| -------------------- | -------- | ------------------------------------- | ------------------------------------------- |
| `store.path`         | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Розташування індексу (підтримує токен `{agentId}`) |
| `store.fts.tokenizer`| `string` | `unicode61`                           | Токенізатор FTS5 (`unicode61` або `trigram`) |

---

## Конфігурація бекенда QMD

Щоб увімкнути, задайте `memory.backend = "qmd"`. Усі налаштування QMD розміщені в `memory.qmd`:

| Ключ                     | Тип       | Типове значення | Опис                                         |
| ------------------------ | --------- | --------------- | -------------------------------------------- |
| `command`                | `string`  | `qmd`           | Шлях до виконуваного файла QMD               |
| `searchMode`             | `string`  | `search`        | Команда пошуку: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`          | Автоматично індексувати `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --              | Додаткові шляхи: `{ name, path, pattern? }`  |
| `sessions.enabled`       | `boolean` | `false`         | Індексувати transcripts сесій                |
| `sessions.retentionDays` | `number`  | --              | Термін зберігання transcript                 |
| `sessions.exportDir`     | `string`  | --              | Каталог експорту                             |

OpenClaw віддає перевагу поточним формам колекцій QMD і запитів MCP, але зберігає працездатність старіших релізів QMD, повертаючись до застарілих прапорців колекцій `--mask` і старіших назв tools MCP, коли це потрібно.

<Note>
Перевизначення моделей QMD залишаються на боці QMD, а не в конфігурації OpenClaw. Якщо вам потрібно глобально перевизначити моделі QMD, задайте змінні середовища, як-от `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` і `QMD_GENERATE_MODEL`, у середовищі runtime Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Розклад оновлення">
    | Ключ                    | Тип       | Типове значення | Опис                                  |
    | ----------------------- | --------- | --------------- | ------------------------------------- |
    | `update.interval`       | `string`  | `5m`            | Інтервал оновлення                    |
    | `update.debounceMs`     | `number`  | `15000`         | Debounce змін файлів                  |
    | `update.onBoot`         | `boolean` | `true`          | Оновлювати під час запуску            |
    | `update.waitForBootSync`| `boolean` | `false`         | Блокувати запуск до завершення оновлення |
    | `update.embedInterval`  | `string`  | --              | Окремий cadence для embeddings        |
    | `update.commandTimeoutMs` | `number`| --              | Тайм-аут для команд QMD               |
    | `update.updateTimeoutMs`  | `number`| --              | Тайм-аут для операцій оновлення QMD   |
    | `update.embedTimeoutMs`   | `number`| --              | Тайм-аут для операцій embeddings QMD  |
  </Accordion>
  <Accordion title="Ліміти">
    | Ключ                    | Тип      | Типове значення | Опис                         |
    | ----------------------- | -------- | --------------- | ---------------------------- |
    | `limits.maxResults`     | `number` | `6`             | Максимум результатів пошуку  |
    | `limits.maxSnippetChars`| `number` | --              | Обмежити довжину snippet     |
    | `limits.maxInjectedChars` | `number`| --              | Обмежити загальну кількість вставлених символів |
    | `limits.timeoutMs`      | `number` | `4000`          | Тайм-аут пошуку              |
  </Accordion>
  <Accordion title="Область дії">
    Керує тим, які сесії можуть отримувати результати пошуку QMD. Та сама schema, що й у [`session.sendPolicy`](/uk/gateway/config-agents#session):

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

    Типове значення, яке постачається, дозволяє direct- і channel-сесії, але все одно забороняє групи.

    Типове значення — лише DM. `match.keyPrefix` відповідає нормалізованому ключу сесії; `match.rawKeyPrefix` відповідає сирому ключу, включно з `agent:<id>:`.

  </Accordion>
  <Accordion title="Цитати">
    `memory.citations` застосовується до всіх бекендів:

    | Значення         | Поведінка                                           |
    | ---------------- | --------------------------------------------------- |
    | `auto` (типово)  | Включати footer `Source: <path#line>` у snippets    |
    | `on`             | Завжди включати footer                              |
    | `off`            | Не включати footer (шлях усе одно передається агенту внутрішньо) |

  </Accordion>
</AccordionGroup>

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

Dreaming налаштовується в `plugins.entries.memory-core.config.dreaming`, а не в `agents.defaults.memorySearch`.

Dreaming виконується як один запланований прохід і використовує внутрішні фази light/deep/REM як деталь реалізації.

Концептуальну поведінку й slash commands див. у [Dreaming](/uk/concepts/dreaming).

### Користувацькі налаштування

| Ключ       | Тип       | Типове значення | Опис                                             |
| ---------- | --------- | --------------- | ------------------------------------------------ |
| `enabled`  | `boolean` | `false`         | Повністю ввімкнути або вимкнути Dreaming         |
| `frequency`| `string`  | `0 3 * * *`     | Необов’язковий Cron-розклад для повного проходу Dreaming |

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

<Note>
- Dreaming записує машинний стан у `memory/.dreams/`.
- Dreaming записує зрозумілий для людини наративний вивід у `DREAMS.md` (або наявний `dreams.md`).
- Політика й пороги фаз light/deep/REM є внутрішньою поведінкою, а не користувацькою конфігурацією.
</Note>

## Пов’язане

- [Configuration reference](/uk/gateway/configuration-reference)
- [Memory overview](/uk/concepts/memory)
- [Memory search](/uk/concepts/memory-search)
