---
read_when:
    - Ви хочете моделі MiniMax в OpenClaw
    - Вам потрібні вказівки з налаштування MiniMax
summary: Використання моделей MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-05T18:14:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 353e1d9ce1b48c90ccaba6cc0109e839c473ca3e65d0c5d8ba744e9011c2bf45
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

Provider MiniMax в OpenClaw за замовчуванням використовує **MiniMax M2.7**.

MiniMax також надає:

- вбудований синтез мовлення через T2A v2
- вбудоване розуміння зображень через `MiniMax-VL-01`
- вбудований `web_search` через search API MiniMax Coding Plan

Розподіл provider:

- `minimax`: текстовий provider з API-key, а також вбудована генерація зображень, розуміння зображень, мовлення і web search
- `minimax-portal`: текстовий provider з OAuth, а також вбудована генерація зображень і розуміння зображень

## Лінійка моделей

- `MiniMax-M2.7`: розміщена reasoning-модель за замовчуванням.
- `MiniMax-M2.7-highspeed`: швидший reasoning-рівень M2.7.
- `image-01`: модель генерації зображень (генерація та редагування image-to-image).

## Генерація зображень

Plugin MiniMax реєструє модель `image-01` для tool `image_generate`. Вона підтримує:

- **Генерацію зображень із тексту** з керуванням співвідношенням сторін.
- **Редагування image-to-image** (subject reference) з керуванням співвідношенням сторін.
- До **9 вихідних зображень** на запит.
- До **1 еталонного зображення** на запит редагування.
- Підтримувані співвідношення сторін: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`.

Щоб використовувати MiniMax для генерації зображень, установіть його як provider генерації зображень:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin використовує той самий `MINIMAX_API_KEY` або OAuth auth, що й текстові моделі. Якщо MiniMax уже налаштовано, додаткова конфігурація не потрібна.

І `minimax`, і `minimax-portal` реєструють `image_generate` з тією самою
моделлю `image-01`. Налаштування з API-key використовують `MINIMAX_API_KEY`; налаштування з OAuth натомість можуть використовувати
вбудований шлях auth `minimax-portal`.

Коли онбординг або налаштування API-key записують явні записи `models.providers.minimax`,
OpenClaw матеріалізує `MiniMax-M2.7` і
`MiniMax-M2.7-highspeed` з `input: ["text", "image"]`.

Сам вбудований каталог текстового provider MiniMax залишається метаданими лише для тексту,
доки не з’явиться ця явна конфігурація provider. Розуміння зображень надається окремо
через media provider `MiniMax-VL-01`, що належить plugin.

## Розуміння зображень

Plugin MiniMax реєструє розуміння зображень окремо від текстового
каталогу:

- `minimax`: модель зображень за замовчуванням `MiniMax-VL-01`
- `minimax-portal`: модель зображень за замовчуванням `MiniMax-VL-01`

Саме тому автоматична маршрутизація медіа може використовувати розуміння зображень MiniMax навіть
тоді, коли каталог вбудованого текстового provider досі показує посилання чату M2.7 лише як текстові.

## Web search

Plugin MiniMax також реєструє `web_search` через search API
MiniMax Coding Plan.

- ID provider: `minimax`
- Структуровані результати: заголовки, URL, фрагменти, пов’язані запити
- Бажана змінна середовища: `MINIMAX_CODE_PLAN_KEY`
- Прийнятний псевдонім env: `MINIMAX_CODING_API_KEY`
- Резервний варіант сумісності: `MINIMAX_API_KEY`, якщо він уже вказує на токен coding-plan
- Повторне використання регіону: `plugins.entries.minimax.config.webSearch.region`, потім `MINIMAX_API_HOST`, потім базові URL provider MiniMax
- Search залишається на ID provider `minimax`; налаштування OAuth CN/global усе ще може опосередковано керувати регіоном через `models.providers.minimax-portal.baseUrl`

Конфігурація міститься в `plugins.entries.minimax.config.webSearch.*`.
Див. [MiniMax Search](/tools/minimax-search).

## Виберіть варіант налаштування

### MiniMax OAuth (Coding Plan) - рекомендовано

**Найкраще для:** швидкого налаштування MiniMax Coding Plan через OAuth, без API key.

Автентифікуйтеся через явний регіональний варіант OAuth:

```bash
openclaw onboard --auth-choice minimax-global-oauth
# or
openclaw onboard --auth-choice minimax-cn-oauth
```

Відповідність варіантів:

- `minimax-global-oauth`: міжнародні користувачі (`api.minimax.io`)
- `minimax-cn-oauth`: користувачі в Китаї (`api.minimaxi.com`)

Подробиці див. у README пакета plugin MiniMax в репозиторії OpenClaw.

### MiniMax M2.7 (API key)

**Найкраще для:** розміщеного MiniMax із Anthropic-compatible API.

Налаштування через CLI:

- Інтерактивний онбординг:

```bash
openclaw onboard --auth-choice minimax-global-api
# or
openclaw onboard --auth-choice minimax-cn-api
```

- `minimax-global-api`: міжнародні користувачі (`api.minimax.io`)
- `minimax-cn-api`: користувачі в Китаї (`api.minimaxi.com`)

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
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
          {
            id: "MiniMax-M2.7-highspeed",
            name: "MiniMax M2.7 Highspeed",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

На Anthropic-compatible шляху потокової передачі OpenClaw тепер вимикає MiniMax
thinking за замовчуванням, якщо ви явно не встановите `thinking` самостійно. Кінцева точка
потокової передачі MiniMax видає `reasoning_content` у дельта-чанках у стилі OpenAI,
а не в нативних блоках thinking Anthropic, через що внутрішні міркування
можуть потрапити у видимий вивід, якщо не вимкнути це неявно.

### MiniMax M2.7 як резервний варіант (приклад)

**Найкраще для:** збереження вашої найсильнішої моделі останнього покоління як основної з перемиканням на MiniMax M2.7 у разі збоїв.
У наведеному нижче прикладі як конкретну основну модель використано Opus; замініть на бажану основну модель останнього покоління.

```json5
{
  env: { MINIMAX_API_KEY: "sk-..." },
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "primary" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

## Налаштування через `openclaw configure`

Використовуйте інтерактивний майстер конфігурації, щоб налаштувати MiniMax без редагування JSON:

1. Запустіть `openclaw configure`.
2. Виберіть **Model/auth**.
3. Виберіть варіант auth **MiniMax**.
4. Виберіть свою модель за замовчуванням, коли буде запит.

Поточні варіанти auth MiniMax у майстрі/CLI:

- `minimax-global-oauth`
- `minimax-cn-oauth`
- `minimax-global-api`
- `minimax-cn-api`

## Параметри конфігурації

- `models.providers.minimax.baseUrl`: бажано `https://api.minimax.io/anthropic` (Anthropic-compatible); `https://api.minimax.io/v1` необов’язковий для OpenAI-compatible payload.
- `models.providers.minimax.api`: бажано `anthropic-messages`; `openai-completions` необов’язковий для OpenAI-compatible payload.
- `models.providers.minimax.apiKey`: API key MiniMax (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: визначає `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost`.
- `agents.defaults.models`: задає псевдоніми моделей, які ви хочете в allowlist.
- `models.mode`: залишайте `merge`, якщо хочете додати MiniMax поруч із вбудованими.

## Примітки

- Посилання на моделі відповідають шляху auth:
  - налаштування з API-key: `minimax/<model>`
  - налаштування з OAuth: `minimax-portal/<model>`
- Модель чату за замовчуванням: `MiniMax-M2.7`
- Альтернативна модель чату: `MiniMax-M2.7-highspeed`
- Для `api: "anthropic-messages"` OpenClaw додає
  `thinking: { type: "disabled" }`, якщо thinking уже не задано явно в
  params/config.
- `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на
  `MiniMax-M2.7-highspeed` на Anthropic-compatible шляху потоку.
- Онбординг і пряме налаштування через API-key записують явні визначення моделей з
  `input: ["text", "image"]` для обох варіантів M2.7
- Вбудований каталог provider наразі показує посилання чату як метадані
  лише для тексту, доки не з’явиться явна конфігурація provider MiniMax
- API використання Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (потрібен ключ coding plan).
- OpenClaw нормалізує використання MiniMax coding-plan до того самого відображення `% left`,
  яке використовується для інших provider. Сирі поля MiniMax `usage_percent` / `usagePercent`
  означають залишок квоти, а не витрачену квоту, тому OpenClaw інвертує їх.
  Якщо наявні поля на основі лічильників, вони мають пріоритет. Коли API повертає `model_remains`,
  OpenClaw надає перевагу запису моделі чату, за потреби виводить мітку вікна з
  `start_time` / `end_time` і включає вибрану назву моделі в мітку плану, щоб вікна coding-plan було легше розрізняти.
- Знімки використання розглядають `minimax`, `minimax-cn` і `minimax-portal` як
  одну й ту саму поверхню квоти MiniMax і надають перевагу збереженому OAuth MiniMax перед
  резервним використанням змінних середовища з ключами Coding Plan.
- Оновіть значення цін у `models.json`, якщо вам потрібне точне відстеження вартості.
- Реферальне посилання для MiniMax Coding Plan (знижка 10%): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Правила provider див. у [/concepts/model-providers](/uk/concepts/model-providers).
- Використовуйте `openclaw models list`, щоб підтвердити поточний ID provider, а потім перемкніть через
  `openclaw models set minimax/MiniMax-M2.7` або
  `openclaw models set minimax-portal/MiniMax-M2.7`.

## Усунення несправностей

### "Unknown model: minimax/MiniMax-M2.7"

Зазвичай це означає, що **provider MiniMax не налаштований** (немає відповідного
запису provider і не знайдено профіль/env key auth MiniMax). Виправлення цього
виявлення є у **2026.1.12**. Виправити можна так:

- Оновіться до **2026.1.12** (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
- Запустіть `openclaw configure` і виберіть варіант auth **MiniMax**, або
- Додайте вручну відповідний блок `models.providers.minimax` або
  `models.providers.minimax-portal`, або
- Установіть `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` або профіль auth MiniMax,
  щоб можна було впровадити відповідний provider.

Переконайтеся, що ID моделі **чутливий до регістру**:

- шлях API-key: `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed`
- шлях OAuth: `minimax-portal/MiniMax-M2.7` або
  `minimax-portal/MiniMax-M2.7-highspeed`

Потім перевірте ще раз:

```bash
openclaw models list
```
