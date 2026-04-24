---
read_when:
    - Додавання або зміна CLI моделей (models list/set/scan/aliases/fallbacks)
    - Зміна поведінки fallbacks моделі або UX вибору
    - Оновлення probes сканування моделей (tools/images)
summary: 'CLI моделей: list, set, aliases, fallbacks, scan, status'
title: CLI моделей
x-i18n:
    generated_at: "2026-04-24T03:44:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 12f784984c87b33e645ec296f7f93ec3acc2a91efa3b63d3a912a6b09b90e048
    source_path: concepts/models.md
    workflow: 15
---

Див. [/concepts/model-failover](/uk/concepts/model-failover) щодо ротації профілів авторизації,
cooldowns і того, як це взаємодіє з fallbacks.
Короткий огляд провайдерів + приклади: [/concepts/model-providers](/uk/concepts/model-providers).

## Як працює вибір моделі

OpenClaw вибирає моделі в такому порядку:

1. **Основна** модель (`agents.defaults.model.primary` або `agents.defaults.model`).
2. **Fallbacks** у `agents.defaults.model.fallbacks` (у порядку).
3. **Provider auth failover** відбувається всередині провайдера перед переходом до
   наступної моделі.

Пов’язане:

- `agents.defaults.models` — це allowlist/каталог моделей, які може використовувати OpenClaw (разом з aliases).
- `agents.defaults.imageModel` використовується **лише тоді, коли** основна модель не може приймати зображення.
- `agents.defaults.pdfModel` використовується інструментом `pdf`. Якщо його не задано, інструмент
  переходить до `agents.defaults.imageModel`, а потім до визначеної моделі сесії/за замовчуванням.
- `agents.defaults.imageGenerationModel` використовується спільною можливістю генерації зображень. Якщо його не задано, `image_generate` усе одно може визначити значення за замовчуванням провайдера з авторизацією. Спочатку він пробує поточного провайдера за замовчуванням, а потім решту зареєстрованих провайдерів генерації зображень у порядку provider-id. Якщо ви задаєте конкретний provider/model, також налаштуйте авторизацію/API key цього провайдера.
- `agents.defaults.musicGenerationModel` використовується спільною можливістю генерації музики. Якщо його не задано, `music_generate` усе одно може визначити значення за замовчуванням провайдера з авторизацією. Спочатку він пробує поточного провайдера за замовчуванням, а потім решту зареєстрованих провайдерів генерації музики у порядку provider-id. Якщо ви задаєте конкретний provider/model, також налаштуйте авторизацію/API key цього провайдера.
- `agents.defaults.videoGenerationModel` використовується спільною можливістю генерації відео. Якщо його не задано, `video_generate` усе одно може визначити значення за замовчуванням провайдера з авторизацією. Спочатку він пробує поточного провайдера за замовчуванням, а потім решту зареєстрованих провайдерів генерації відео у порядку provider-id. Якщо ви задаєте конкретний provider/model, також налаштуйте авторизацію/API key цього провайдера.
- Значення за замовчуванням для окремого агента можуть перевизначати `agents.defaults.model` через `agents.list[].model` разом із bindings (див. [/concepts/multi-agent](/uk/concepts/multi-agent)).

## Швидка політика моделей

- Установіть як основну найсильнішу модель останнього покоління, доступну вам.
- Використовуйте fallbacks для завдань, чутливих до вартості/затримки, і менш критичних чатів.
- Для агентів з увімкненими інструментами або недовірених входів уникайте старіших/слабших рівнів моделей.

## Онбординг (рекомендовано)

Якщо ви не хочете вручну редагувати config, запустіть онбординг:

```bash
openclaw onboard
```

Він може налаштувати модель + авторизацію для поширених провайдерів, включно з **OpenAI Code (Codex)
subscription** (OAuth) і **Anthropic** (API key або Claude CLI).

## Ключі config (огляд)

- `agents.defaults.model.primary` і `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` і `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` і `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` і `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` і `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + aliases + параметри провайдера)
- `models.providers` (власні провайдери, записані в `models.json`)

Посилання на моделі нормалізуються до нижнього регістру. Aliases провайдерів, як-от `z.ai/*`, нормалізуються
до `zai/*`.

Приклади конфігурації провайдерів (включно з OpenCode) наведено в
[/providers/opencode](/uk/providers/opencode).

### Безпечне редагування allowlist

Використовуйте адитивні записи під час ручного оновлення `agents.defaults.models`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` захищає мапи моделей/провайдерів від випадкового перезапису. Звичайне
присвоєння об’єкта для `agents.defaults.models`, `models.providers` або
`models.providers.<id>.models` відхиляється, якщо воно видалить наявні
записи. Використовуйте `--merge` для адитивних змін; використовуйте `--replace` лише тоді, коли
надане значення має стати повним цільовим значенням.

Інтерактивне налаштування провайдера і `openclaw configure --section model` також об’єднують
вибір у межах провайдера з наявним allowlist, тож додавання Codex,
Ollama або іншого провайдера не видаляє незв’язані записи моделей.

## «Model is not allowed» (і чому відповіді зупиняються)

Якщо задано `agents.defaults.models`, воно стає **allowlist** для `/model` і для
перевизначень сесії. Коли користувач вибирає модель, якої немає в цьому allowlist,
OpenClaw повертає:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Це відбувається **до** генерації звичайної відповіді, тому повідомлення може виглядати
так, ніби «відповіді не було». Виправлення:

- Додати модель до `agents.defaults.models`, або
- Очистити allowlist (видалити `agents.defaults.models`), або
- Вибрати модель із `/model list`.

Приклад конфігурації allowlist:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Перемикання моделей у чаті (`/model`)

Ви можете перемикати моделі для поточної сесії без перезапуску:

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Примітки:

- `/model` (і `/model list`) — це компактний нумерований вибір (сімейство моделей + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний вибір із випадними списками провайдера й моделі та кроком Submit.
- `/models add` доступна за замовчуванням і може бути вимкнена через `commands.modelsWrite=false`.
- Якщо увімкнено, `/models add <provider> <modelId>` — найшвидший шлях; просто `/models add` запускає керований потік спочатку з вибором провайдера, де це підтримується.
- Після `/models add` нова модель стає доступною в `/models` і `/model` без перезапуску gateway.
- `/model <#>` вибирає з цього засобу вибору.
- `/model` негайно зберігає новий вибір сесії.
- Якщо агент неактивний, наступний запуск одразу використовує нову модель.
- Якщо запуск уже активний, OpenClaw позначає перемикання під час роботи як очікуване й перезапускає з новою моделлю лише в чистій точці повторної спроби.
- Якщо активність інструмента або виведення відповіді вже почалися, очікуване перемикання може залишатися в черзі до наступної можливості повторної спроби або наступного ходу користувача.
- `/model status` — це докладний вигляд (кандидати авторизації та, коли налаштовано, `baseUrl` endpoint провайдера + режим `api`).
- Посилання на моделі розбираються за першим `/`. Використовуйте `provider/model`, коли вводите `/model <ref>`.
- Якщо сам ID моделі містить `/` (у стилі OpenRouter), ви маєте вказати префікс провайдера (приклад: `/model openrouter/moonshotai/kimi-k2`).
- Якщо ви не вказали провайдера, OpenClaw визначає введення в такому порядку:
  1. збіг alias
  2. унікальний збіг налаштованого провайдера для точного model id без префікса
  3. застарілий резервний перехід до налаштованого провайдера за замовчуванням
     Якщо цей провайдер більше не надає налаштовану модель за замовчуванням, OpenClaw
     натомість переходить до першого налаштованого провайдера/моделі, щоб уникнути
     показу застарілого значення за замовчуванням від видаленого провайдера.

Повна поведінка/конфігурація команд: [Слеш-команди](/uk/tools/slash-commands).

Приклади:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## Команди CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (без підкоманди) — це скорочення для `models status`.

### `models list`

За замовчуванням показує налаштовані моделі. Корисні прапорці:

- `--all`: повний каталог
- `--local`: лише локальні провайдери
- `--provider <id>`: фільтр за id провайдера, наприклад `moonshot`; display
  labels з інтерактивних засобів вибору не приймаються
- `--plain`: одна модель на рядок
- `--json`: машинозчитуваний вивід

`--all` включає вбудовані статичні рядки каталогу, що належать провайдеру, ще до налаштування авторизації,
тому подання лише для виявлення можуть показувати моделі, недоступні, доки
ви не додасте відповідні облікові дані провайдера.

### `models status`

Показує визначену основну модель, fallbacks, image model та огляд
авторизації налаштованих провайдерів. Також показує статус завершення строку дії OAuth для профілів, знайдених
у сховищі авторизації (за замовчуванням попереджає за 24 години). `--plain` виводить лише
визначену основну модель.
Статус OAuth показується завжди (і включається у вивід `--json`). Якщо налаштований
провайдер не має облікових даних, `models status` виводить розділ **Missing auth**.
JSON містить `auth.oauth` (вікно попередження + профілі) і `auth.providers`
(ефективна авторизація для кожного провайдера, включно з обліковими даними з env). `auth.oauth`
охоплює лише стан профілів сховища авторизації; провайдери лише з env там не з’являються.
Використовуйте `--check` для автоматизації (код виходу `1` для відсутніх/прострочених, `2` для тих, що скоро завершаться).
Використовуйте `--probe` для живих перевірок авторизації; рядки probe можуть походити з профілів авторизації, облікових даних env
або `models.json`.
Якщо явний `auth.order.<provider>` пропускає збережений профіль,
probe повідомляє `excluded_by_auth_order` замість спроби його використати. Якщо авторизація існує, але для цього провайдера не вдається визначити модель, придатну для probe, probe повідомляє
`status: no_model`.

Вибір авторизації залежить від провайдера/облікового запису. Для завжди активних хостів gateway API
keys зазвичай є найпередбачуванішими; також підтримуються повторне використання Claude CLI та наявні
OAuth/token профілі Anthropic.

Приклад (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Сканування (безкоштовні моделі OpenRouter)

`openclaw models scan` перевіряє **каталог безкоштовних моделей** OpenRouter і може
за потреби виконувати probe моделей на підтримку tools і зображень.

Ключові прапорці:

- `--no-probe`: пропустити живі probes (лише метадані)
- `--min-params <b>`: мінімальний розмір параметрів (мільярди)
- `--max-age-days <days>`: пропустити старіші моделі
- `--provider <name>`: фільтр за префіксом провайдера
- `--max-candidates <n>`: розмір списку fallback
- `--set-default`: установити `agents.defaults.model.primary` на перший вибір
- `--set-image`: установити `agents.defaults.imageModel.primary` на перший вибір для зображень

Probing потребує API key OpenRouter (із профілів авторизації або
`OPENROUTER_API_KEY`). Без ключа використовуйте `--no-probe`, щоб лише перелічити кандидатів.

Результати сканування ранжуються за:

1. Підтримкою зображень
2. Затримкою tools
3. Розміром контексту
4. Кількістю параметрів

Вхідні дані

- список OpenRouter `/models` (фільтр `:free`)
- потрібен API key OpenRouter із профілів авторизації або `OPENROUTER_API_KEY` (див. [/environment](/uk/help/environment))
- необов’язкові фільтри: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- керування probe: `--timeout`, `--concurrency`

Під час запуску в TTY ви можете інтерактивно вибирати fallbacks. У неінтерактивному
режимі передайте `--yes`, щоб прийняти значення за замовчуванням.

## Реєстр моделей (`models.json`)

Власні провайдери в `models.providers` записуються в `models.json` у каталозі
агента (за замовчуванням `~/.openclaw/agents/<agentId>/agent/models.json`). Цей файл
за замовчуванням об’єднується, якщо тільки `models.mode` не встановлено в `replace`.

Пріоритет режиму merge для однакових ID провайдерів:

- Непорожній `baseUrl`, уже наявний в `models.json` агента, має пріоритет.
- Непорожній `apiKey` у `models.json` агента має пріоритет лише тоді, коли цей провайдер не керується через SecretRef у поточному контексті config/auth-profile.
- Значення `apiKey` провайдера, керовані SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для env refs, `secretref-managed` для file/exec refs) замість збереження визначених секретів.
- Значення заголовків провайдера, керовані SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для env refs, `secretref-managed` для file/exec refs).
- Порожні або відсутні `apiKey`/`baseUrl` агента використовують резервні значення з config `models.providers`.
- Інші поля провайдера оновлюються з config і нормалізованих даних каталогу.

Збереження маркерів є авторитетним щодо джерела: OpenClaw записує маркери з активного знімка config джерела (до визначення), а не з визначених секретних значень runtime.
Це застосовується щоразу, коли OpenClaw повторно генерує `models.json`, включно зі шляхами, ініційованими командами, як-от `openclaw agent`.

## Пов’язане

- [Model Providers](/uk/concepts/model-providers) — маршрутизація провайдерів і авторизація
- [Model Failover](/uk/concepts/model-failover) — ланцюжки fallback
- [Image Generation](/uk/tools/image-generation) — конфігурація моделі зображень
- [Music Generation](/uk/tools/music-generation) — конфігурація моделі генерації музики
- [Video Generation](/uk/tools/video-generation) — конфігурація моделі генерації відео
- [Configuration Reference](/uk/gateway/config-agents#agent-defaults) — ключі config моделей
