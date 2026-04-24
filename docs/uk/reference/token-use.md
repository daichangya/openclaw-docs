---
read_when:
    - Пояснення використання токенів, вартості або вікон контексту
    - Налагодження зростання контексту або поведінки Compaction
summary: Як OpenClaw будує контекст prompt і звітує про використання токенів та вартість
title: Використання токенів і вартість
x-i18n:
    generated_at: "2026-04-24T03:20:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a95e7592a06bd750c0bfc9303d8cec2a538756e95f35c3001dc960cfebcadbf
    source_path: reference/token-use.md
    workflow: 15
---

# Використання токенів і вартість

OpenClaw відстежує **токени**, а не символи. Токени залежать від моделі, але більшість
моделей у стилі OpenAI у середньому мають ~4 символи на токен для англійського тексту.

## Як будується system prompt

OpenClaw збирає власний system prompt під час кожного запуску. Він містить:

- Список інструментів + короткі описи
- Список Skills (лише метадані; інструкції завантажуються за запитом через `read`).
  Компактний блок Skills обмежується `skills.limits.maxSkillsPromptChars`,
  із необов’язковим перевизначенням для агента в
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Інструкції для self-update
- Workspace + bootstrap-файли (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` для нових агентів, а також `MEMORY.md`, якщо він є). Кореневий `memory.md` у нижньому регістрі не інжектується; це вхід для legacy repair для `openclaw doctor --fix`, коли він присутній разом із `MEMORY.md`. Великі файли обрізаються за `agents.defaults.bootstrapMaxChars` (типово: 12000), а загальна ін’єкція bootstrap обмежується `agents.defaults.bootstrapTotalMaxChars` (типово: 60000). Щоденні файли `memory/*.md` не є частиною звичайного bootstrap prompt; вони залишаються доступними за запитом через інструменти пам’яті у звичайних turn, але прості `/new` і `/reset` можуть додати одноразовий блок startup-context із недавньою щоденною пам’яттю для першого turn. Ця startup prelude керується через `agents.defaults.startupContext`.
- Час (UTC + часовий пояс користувача)
- Теги відповіді + поведінка Heartbeat
- Метадані runtime (хост/ОС/модель/thinking)

Повний розбір див. у [System Prompt](/uk/concepts/system-prompt).

## Що враховується у вікні контексту

Усе, що отримує модель, враховується в межі контексту:

- System prompt (усі перелічені вище секції)
- Історія розмови (повідомлення користувача + асистента)
- Виклики інструментів і результати інструментів
- Вкладення/транскрипти (зображення, аудіо, файли)
- Підсумки Compaction і артефакти обрізання
- Обгортки провайдера або заголовки безпеки (не видимі, але все одно враховуються)

Деякі важкі поверхні runtime мають власні явні обмеження:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Перевизначення для агента розташовані в `agents.list[].contextLimits`. Ці параметри
призначені для обмежених runtime-уривків та інжектованих блоків, якими володіє runtime. Вони
окремі від обмежень bootstrap, startup-context і обмежень prompt для Skills.

Для зображень OpenClaw зменшує розмір payload зображень із транскриптів/інструментів перед викликами провайдера.
Для налаштування використовуйте `agents.defaults.imageMaxDimensionPx` (типово: `1200`):

- Нижчі значення зазвичай зменшують використання vision-токенів і розмір payload.
- Вищі значення зберігають більше візуальних деталей для OCR/UI-насичених скриншотів.

Для практичного розбору (по кожному інжектованому файлу, інструментах, Skills і розміру system prompt) використовуйте `/context list` або `/context detail`. Див. [Context](/uk/concepts/context).

## Як побачити поточне використання токенів

Використовуйте це в чаті:

- `/status` → **картка стану з emoji** із моделлю сесії, використанням контексту,
  вхідними/вихідними токенами останньої відповіді та **орієнтовною вартістю** (лише для API-ключа).
- `/usage off|tokens|full` → додає **нижній колонтитул використання для кожної відповіді** до кожної відповіді.
  - Зберігається для сесії (зберігається як `responseUsage`).
  - Автентифікація OAuth **приховує вартість** (лише токени).
- `/usage cost` → показує локальний підсумок вартості з логів сесії OpenClaw.

Інші поверхні:

- **TUI/Web TUI:** підтримуються `/status` + `/usage`.
- **CLI:** `openclaw status --usage` і `openclaw channels list` показують
  нормалізовані вікна квот провайдера (`X% left`, а не вартість за відповідь).
  Поточні провайдери з вікнами використання: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi і z.ai.

Поверхні використання нормалізують поширені нативні псевдоніми полів провайдерів перед показом.
Для трафіку OpenAI-family Responses це включає і `input_tokens` /
`output_tokens`, і `prompt_tokens` / `completion_tokens`, тому специфічні для транспорту
назви полів не змінюють `/status`, `/usage` або підсумки сесії.
Використання Gemini CLI JSON також нормалізується: текст відповіді береться з `response`, а
`stats.cached` зіставляється з `cacheRead`, при цьому використовується `stats.input_tokens - stats.cached`,
коли CLI не надає явного поля `stats.input`.
Для нативного трафіку OpenAI-family Responses псевдоніми використання WebSocket/SSE
нормалізуються так само, а підсумки використовують нормалізовані input + output, якщо
`total_tokens` відсутній або дорівнює `0`.
Коли поточний snapshot сесії є розрідженим, `/status` і `session_status` також можуть
відновлювати лічильники токенів/кешу й мітку активної моделі runtime з
найновішого логу використання в транскрипті. Наявні ненульові live-значення все ще мають
пріоритет над fallback-значеннями з транскрипту, а більші totals із транскрипту,
орієнтовані на prompt, можуть перемагати, коли збережені totals відсутні або менші.
Автентифікація використання для вікон квот провайдера надходить із hook-ів, специфічних для провайдера, коли вони доступні;
інакше OpenClaw використовує fallback до відповідних облікових даних OAuth/API-key
з профілів автентифікації, env або config.
Записи транскрипту асистента зберігають ту саму нормалізовану форму використання, включно з
`usage.cost`, коли для активної моделі налаштовано pricing і провайдер повертає метадані використання. Це дає `/usage cost` і статусу сесії на основі транскрипту
стабільне джерело навіть після зникнення live-стану runtime.

## Оцінка вартості (коли показується)

Вартість оцінюється на основі вашої конфігурації цін моделі:

```
models.providers.<provider>.models[].cost
```

Це **USD за 1M токенів** для `input`, `output`, `cacheRead` і
`cacheWrite`. Якщо pricing відсутній, OpenClaw показує лише токени. Токени OAuth
ніколи не показують вартість у доларах.

## Вплив TTL кешу й обрізання

Кешування prompt провайдера застосовується лише в межах вікна TTL кешу. OpenClaw може
необов’язково запускати **cache-ttl pruning**: він обрізає сесію після того, як TTL кешу
спливає, а потім скидає вікно кешу, щоб наступні запити могли повторно використовувати
свіжокешований контекст замість повторного кешування всієї історії. Це утримує
витрати на cache write нижчими, коли сесія простоює довше за TTL.

Налаштуйте це в [конфігурації Gateway](/uk/gateway/configuration) і див. деталі
поведінки в [Session pruning](/uk/concepts/session-pruning).

Heartbeat може тримати кеш **теплим** під час періодів простою. Якщо TTL кешу вашої моделі
становить `1h`, встановлення інтервалу Heartbeat трохи нижче цього значення (наприклад, `55m`) може уникнути
повторного кешування всього prompt, зменшуючи витрати на cache write.

У конфігураціях із кількома агентами ви можете зберігати одну спільну конфігурацію моделі й налаштовувати поведінку кешу
для кожного агента через `agents.list[].params.cacheRetention`.

Повний покроковий довідник за всіма параметрами див. у [Prompt Caching](/uk/reference/prompt-caching).

Для цін Anthropic API cache reads значно дешевші за input
tokens, тоді як cache writes тарифікуються з вищим множником. Див. ціни Anthropic на
prompt caching для актуальних ставок і множників TTL:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Приклад: тримати кеш 1h теплим за допомогою Heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Приклад: змішаний трафік зі стратегією кешу для кожного агента

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # типова базова лінія для більшості агентів
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # тримати довгий кеш теплим для глибоких сесій
    - id: "alerts"
      params:
        cacheRetention: "none" # уникати cache writes для сплескових сповіщень
```

`agents.list[].params` зливається поверх `params` вибраної моделі, тож ви можете
перевизначити лише `cacheRetention` і успадкувати інші типові значення моделі без змін.

### Приклад: увімкнення beta-заголовка Anthropic 1M context

Вікно контексту Anthropic 1M зараз закрите beta-доступом. OpenClaw може інжектувати
потрібне значення `anthropic-beta`, коли ви вмикаєте `context1m` для підтримуваних моделей Opus
або Sonnet.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Це зіставляється з beta-заголовком Anthropic `context-1m-2025-08-07`.

Це застосовується лише тоді, коли для цього запису моделі встановлено `context1m: true`.

Вимога: облікові дані мають бути придатними для використання довгого контексту. Інакше
Anthropic відповість помилкою rate limit на стороні провайдера для цього запиту.

Якщо ви автентифікуєте Anthropic через токени OAuth/subscription (`sk-ant-oat-*`),
OpenClaw пропускає beta-заголовок `context-1m-*`, оскільки Anthropic наразі
відхиляє таку комбінацію з HTTP 401.

## Поради щодо зменшення тиску токенів

- Використовуйте `/compact`, щоб підсумовувати довгі сесії.
- Обрізайте великі виводи інструментів у своїх робочих процесах.
- Зменшуйте `agents.defaults.imageMaxDimensionPx` для сесій із великою кількістю скриншотів.
- Тримайте описи Skills короткими (список Skills інжектується в prompt).
- Для багатослівної, дослідницької роботи віддавайте перевагу меншим моделям.

Точну формулу накладних витрат списку Skills див. у [Skills](/uk/tools/skills).

## Пов’язане

- [Використання API та вартість](/uk/reference/api-usage-costs)
- [Prompt caching](/uk/reference/prompt-caching)
- [Відстеження використання](/uk/concepts/usage-tracking)
