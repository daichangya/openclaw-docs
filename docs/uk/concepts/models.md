---
read_when:
    - Додавання або зміна CLI моделей (models list/set/scan/aliases/fallbacks)
    - Зміна поведінки fallback моделей або UX вибору
    - Оновлення перевірок сканування моделей (tools/images)
summary: 'CLI моделей: список, встановлення, псевдоніми, fallback, сканування, статус'
title: CLI моделей
x-i18n:
    generated_at: "2026-04-05T18:01:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: b6a24f7621b0dd573571164b6690731eb318f7f78972dd310b9b6a9a3888489e
    source_path: concepts/models.md
    workflow: 15
---

# CLI моделей

Див. [/concepts/model-failover](/concepts/model-failover) щодо ротації профілів
автентифікації, cooldown і того, як це взаємодіє з fallback.
Короткий огляд провайдерів + приклади: [/concepts/model-providers](/concepts/model-providers).

## Як працює вибір моделі

OpenClaw вибирає моделі в такому порядку:

1. **Основна** модель (`agents.defaults.model.primary` або `agents.defaults.model`).
2. **Fallback** у `agents.defaults.model.fallbacks` (у порядку списку).
3. **Failover автентифікації провайдера** відбувається всередині провайдера перед переходом до
   наступної моделі.

Пов’язане:

- `agents.defaults.models` — це allowlist/каталог моделей, які OpenClaw може використовувати (разом із псевдонімами).
- `agents.defaults.imageModel` використовується **лише тоді**, коли основна модель не може приймати зображення.
- `agents.defaults.pdfModel` використовується інструментом `pdf`. Якщо не вказано, інструмент
  повертається до `agents.defaults.imageModel`, а потім до визначеної для сесії/типової
  моделі.
- `agents.defaults.imageGenerationModel` використовується спільною поверхнею можливостей генерації зображень. Якщо його не вказано, `image_generate` усе одно може визначити типовий провайдер із автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації зображень у порядку provider-id. Якщо ви задаєте конкретного провайдера/модель, також налаштуйте автентифікацію/API-ключ цього провайдера.
- `agents.defaults.videoGenerationModel` використовується спільною поверхнею можливостей генерації відео. Якщо його не вказано, `video_generate` усе одно може визначити типовий провайдер із автентифікацією. Спочатку він пробує поточного типового провайдера, а потім решту зареєстрованих провайдерів генерації відео в порядку provider-id. Якщо ви задаєте конкретного провайдера/модель, також налаштуйте автентифікацію/API-ключ цього провайдера.
- Типові значення для окремого агента можуть перевизначати `agents.defaults.model` через `agents.list[].model` плюс bindings (див. [/concepts/multi-agent](/concepts/multi-agent)).

## Швидка політика щодо моделей

- Установіть основною найсильнішу модель останнього покоління, доступну вам.
- Використовуйте fallback для завдань, чутливих до вартості/затримки, і для менш критичних чатів.
- Для агентів із увімкненими tools або недовірених вхідних даних уникайте старіших/слабших рівнів моделей.

## Онбординг (рекомендовано)

Якщо ви не хочете редагувати конфігурацію вручну, запустіть онбординг:

```bash
openclaw onboard
```

Він може налаштувати модель + автентифікацію для поширених провайдерів, зокрема **OpenAI Code (Codex)
subscription** (OAuth) і **Anthropic** (API-ключ або Claude CLI).

## Ключі конфігурації (огляд)

- `agents.defaults.model.primary` і `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` і `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` і `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` і `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` і `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + псевдоніми + параметри провайдера)
- `models.providers` (власні провайдери, записані в `models.json`)

Посилання на моделі нормалізуються до нижнього регістру. Псевдоніми провайдерів на кшталт `z.ai/*` нормалізуються
до `zai/*`.

Приклади конфігурації провайдерів (зокрема OpenCode) наведено в
[/providers/opencode](/providers/opencode).

## «Model is not allowed» (і чому відповіді зупиняються)

Якщо встановлено `agents.defaults.models`, воно стає **allowlist** для `/model` і для
перевизначень сесії. Коли користувач вибирає модель, якої немає в цьому allowlist,
OpenClaw повертає:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Це відбувається **до** генерації звичайної відповіді, тому може здаватися,
що на повідомлення «не відповіли». Виправлення полягає в тому, щоб:

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

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Примітки:

- `/model` (і `/model list`) — це компактний нумерований засіб вибору (сімейство моделей + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний засіб вибору з випадними списками провайдера й моделі та кроком Submit.
- `/model <#>` вибирає зі списку цього засобу вибору.
- `/model` негайно зберігає новий вибір сесії.
- Якщо агент неактивний, наступний запуск одразу використовуватиме нову модель.
- Якщо запуск уже активний, OpenClaw позначає живе перемикання як відкладене й перезапускає з новою моделлю лише в чистій точці повторної спроби.
- Якщо активність tools або виведення відповіді вже розпочалися, відкладене перемикання може залишатися в черзі до наступної можливості повторної спроби або до наступного ходу користувача.
- `/model status` — це докладний режим перегляду (кандидати автентифікації і, коли налаштовано, `baseUrl` кінцевої точки провайдера + режим `api`).
- Посилання на моделі розбираються за розділенням на **першому** `/`. Використовуйте `provider/model`, коли вводите `/model <ref>`.
- Якщо сам ID моделі містить `/` (стиль OpenRouter), ви маєте включити префікс провайдера (приклад: `/model openrouter/moonshotai/kimi-k2`).
- Якщо ви пропускаєте провайдера, OpenClaw визначає введення в такому порядку:
  1. збіг псевдоніма
  2. унікальний збіг налаштованого провайдера для цього точного ID моделі без префікса
  3. застарілий fallback до налаштованого типового провайдера
     Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw
     замість цього переходить до першої налаштованої пари провайдер/модель, щоб
     не показувати застаріле типове значення видаленого провайдера.

Повна поведінка команди/конфігурації: [Slash commands](/tools/slash-commands).

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

Типово показує налаштовані моделі. Корисні прапорці:

- `--all`: повний каталог
- `--local`: лише локальні провайдери
- `--provider <name>`: фільтр за провайдером
- `--plain`: одна модель на рядок
- `--json`: машинозчитуваний вивід

### `models status`

Показує визначену основну модель, fallback, модель для зображень і огляд автентифікації
налаштованих провайдерів. Також показує стан завершення строку дії OAuth для профілів, знайдених
у сховищі автентифікації (типово попереджає за 24 год). `--plain` виводить лише
визначену основну модель.
Стан OAuth показується завжди (і включається у вивід `--json`). Якщо налаштований
провайдер не має облікових даних, `models status` виводить розділ **Missing auth**.
JSON включає `auth.oauth` (вікно попередження + профілі) і `auth.providers`
(ефективна автентифікація для кожного провайдера).
Використовуйте `--check` для автоматизації (код виходу `1` для відсутньої/простроченої автентифікації, `2` для такої, що скоро спливає).
Використовуйте `--probe` для живих перевірок автентифікації; рядки перевірки можуть надходити з профілів автентифікації, облікових даних середовища
або `models.json`.
Якщо явний `auth.order.<provider>` пропускає збережений профіль, перевірка повідомляє
`excluded_by_auth_order` замість спроби використати його. Якщо автентифікація є, але для цього провайдера не вдається визначити модель для перевірки, перевірка повертає `status: no_model`.

Вибір автентифікації залежить від провайдера/облікового запису. Для постійно активних gateway-хостів
API-ключі зазвичай є найпередбачуванішими; також підтримуються повторне використання Claude CLI та наявні профілі OAuth/токенів Anthropic.

Приклад (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Сканування (безкоштовні моделі OpenRouter)

`openclaw models scan` перевіряє **каталог безкоштовних моделей** OpenRouter і може
за бажанням перевіряти моделі на підтримку tools і зображень.

Основні прапорці:

- `--no-probe`: пропустити живі перевірки (лише метадані)
- `--min-params <b>`: мінімальний розмір параметрів (мільярди)
- `--max-age-days <days>`: пропускати старіші моделі
- `--provider <name>`: фільтр за префіксом провайдера
- `--max-candidates <n>`: розмір списку fallback
- `--set-default`: встановити `agents.defaults.model.primary` на перший вибір
- `--set-image`: встановити `agents.defaults.imageModel.primary` на перший вибір для зображень

Для перевірок потрібен API-ключ OpenRouter (із профілів автентифікації або
`OPENROUTER_API_KEY`). Без ключа використовуйте `--no-probe`, щоб лише переглянути кандидатів.

Результати сканування ранжуються за:

1. Підтримкою зображень
2. Затримкою tools
3. Розміром контексту
4. Кількістю параметрів

Вхідні дані

- Список OpenRouter `/models` (фільтр `:free`)
- Потрібен API-ключ OpenRouter із профілів автентифікації або `OPENROUTER_API_KEY` (див. [/environment](/help/environment))
- Необов’язкові фільтри: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Керування перевірками: `--timeout`, `--concurrency`

Під час запуску в TTY ви можете інтерактивно вибрати fallback. У неінтерактивному
режимі передайте `--yes`, щоб прийняти типові значення.

## Реєстр моделей (`models.json`)

Власні провайдери в `models.providers` записуються в `models.json` у каталозі
агента (типово `~/.openclaw/agents/<agentId>/agent/models.json`). Цей файл
типово об’єднується, якщо лише `models.mode` не встановлено в `replace`.

Пріоритет у режимі злиття для однакових ID провайдерів:

- Непорожній `baseUrl`, уже наявний у `models.json` агента, має пріоритет.
- Непорожній `apiKey` у `models.json` агента має пріоритет лише тоді, коли цей провайдер не керується через SecretRef у поточному контексті конфігурації/профілю автентифікації.
- Значення `apiKey` для провайдера, керованого через SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для env-посилань, `secretref-managed` для file/exec-посилань) замість збереження розв’язаних секретів.
- Значення заголовків для провайдера, керованого через SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для env-посилань, `secretref-managed` для file/exec-посилань).
- Порожні або відсутні `apiKey`/`baseUrl` агента повертаються до конфігурації `models.providers`.
- Інші поля провайдера оновлюються з конфігурації та нормалізованих даних каталогу.

Збереження маркерів є авторитетним щодо джерела: OpenClaw записує маркери з активного знімка конфігурації джерела (до розв’язання), а не з розв’язаних значень секретів runtime.
Це застосовується щоразу, коли OpenClaw перегенеровує `models.json`, зокрема під час командних шляхів, таких як `openclaw agent`.

## Пов’язане

- [Провайдери моделей](/concepts/model-providers) — маршрутизація провайдерів і автентифікація
- [Failover моделей](/concepts/model-failover) — ланцюжки fallback
- [Генерація зображень](/tools/image-generation) — конфігурація моделей зображень
- [Генерація відео](/tools/video-generation) — конфігурація моделей відео
- [Довідник з конфігурації](/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделей
