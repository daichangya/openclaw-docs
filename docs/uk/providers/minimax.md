---
read_when:
    - Ви хочете використовувати моделі MiniMax в OpenClaw
    - Вам потрібні вказівки з налаштування MiniMax
summary: Використовуйте моделі MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-05T22:23:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 32e737d8eb9b9728ec3925f626599bb4be6d0904b6357b29c6f33a315600fef4
    source_path: providers/minimax.md
    workflow: 15
---

# MiniMax

Провайдер MiniMax в OpenClaw за замовчуванням використовує **MiniMax M2.7**.

MiniMax також надає:

- вбудований синтез мовлення через T2A v2
- вбудоване розуміння зображень через `MiniMax-VL-01`
- вбудований `web_search` через API пошуку MiniMax Coding Plan

Розподіл провайдерів:

- `minimax`: текстовий провайдер з API-ключем, а також вбудована генерація зображень, розуміння зображень, мовлення та вебпошук
- `minimax-portal`: текстовий провайдер OAuth, а також вбудована генерація зображень і розуміння зображень

## Лінійка моделей

- `MiniMax-M2.7`: стандартна хостована модель міркування.
- `MiniMax-M2.7-highspeed`: швидший рівень міркування M2.7.
- `image-01`: модель генерації зображень (генерація та редагування image-to-image).

## Генерація зображень

Плагін MiniMax реєструє модель `image-01` для інструмента `image_generate`. Вона підтримує:

- **Генерацію текст-у-зображення** з керуванням співвідношенням сторін.
- **Редагування image-to-image** (референс об'єкта) з керуванням співвідношенням сторін.
- До **9 вихідних зображень** на запит.
- До **1 референсного зображення** на запит редагування.
- Підтримувані співвідношення сторін: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`.

Щоб використовувати MiniMax для генерації зображень, встановіть його як провайдера генерації зображень:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Плагін використовує той самий `MINIMAX_API_KEY` або OAuth-автентифікацію, що й текстові моделі. Додаткова конфігурація не потрібна, якщо MiniMax уже налаштовано.

І `minimax`, і `minimax-portal` реєструють `image_generate` з тією самою
моделлю `image-01`. Налаштування з API-ключем використовують `MINIMAX_API_KEY`; налаштування OAuth можуть натомість використовувати
вбудований шлях автентифікації `minimax-portal`.

Коли онбординг або налаштування через API-ключ записує явні записи
`models.providers.minimax`, OpenClaw матеріалізує `MiniMax-M2.7` і
`MiniMax-M2.7-highspeed` з `input: ["text", "image"]`.

Сам вбудований текстовий каталог MiniMax при цьому залишається метаданими лише для тексту,
доки не з'явиться явна конфігурація цього провайдера. Розуміння зображень надається окремо
через медіапровайдера `MiniMax-VL-01`, який належить плагіну.

Див. [Генерація зображень](/uk/tools/image-generation) для спільних параметрів
інструмента, вибору провайдера та поведінки аварійного перемикання.

## Генерація відео

Вбудований плагін `minimax` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Модель відео за замовчуванням: `minimax/MiniMax-Hailuo-2.3`
- Режими: text-to-video та потоки з одним референсним зображенням
- Підтримує `aspectRatio` і `resolution`

Щоб використовувати MiniMax як провайдера відео за замовчуванням:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

Див. [Генерація відео](/uk/tools/video-generation) для спільних параметрів
інструмента, вибору провайдера та поведінки аварійного перемикання.

## Розуміння зображень

Плагін MiniMax реєструє розуміння зображень окремо від текстового
каталогу:

- `minimax`: стандартна модель зображень `MiniMax-VL-01`
- `minimax-portal`: стандартна модель зображень `MiniMax-VL-01`

Саме тому автоматична маршрутизація медіа може використовувати розуміння зображень MiniMax навіть
тоді, коли вбудований каталог текстового провайдера все ще показує посилання чату M2.7 лише для тексту.

## Вебпошук

Плагін MiniMax також реєструє `web_search` через API пошуку MiniMax Coding Plan.

- Ідентифікатор провайдера: `minimax`
- Структуровані результати: заголовки, URL, сніпети, пов'язані запити
- Бажана змінна середовища: `MINIMAX_CODE_PLAN_KEY`
- Підтримуваний псевдонім змінної середовища: `MINIMAX_CODING_API_KEY`
- Сумісний запасний варіант: `MINIMAX_API_KEY`, якщо він уже вказує на токен coding plan
- Повторне використання регіону: `plugins.entries.minimax.config.webSearch.region`, потім `MINIMAX_API_HOST`, потім базові URL провайдера MiniMax
- Пошук залишається на ідентифікаторі провайдера `minimax`; налаштування OAuth CN/global усе одно може непрямо спрямовувати регіон через `models.providers.minimax-portal.baseUrl`

Конфігурація міститься в `plugins.entries.minimax.config.webSearch.*`.
Див. [Пошук MiniMax](/uk/tools/minimax-search).

## Виберіть спосіб налаштування

### MiniMax OAuth (Coding Plan) - рекомендовано

**Найкраще для:** швидкого налаштування MiniMax Coding Plan через OAuth, без потреби в API-ключі.

Автентифікуйтеся з явним вибором регіонального OAuth:

```bash
openclaw onboard --auth-choice minimax-global-oauth
# або
openclaw onboard --auth-choice minimax-cn-oauth
```

Відповідність варіантів:

- `minimax-global-oauth`: міжнародні користувачі (`api.minimax.io`)
- `minimax-cn-oauth`: користувачі в Китаї (`api.minimaxi.com`)

Деталі дивіться в README пакета плагіна MiniMax у репозиторії OpenClaw.

### MiniMax M2.7 (API-ключ)

**Найкраще для:** хостованого MiniMax із API, сумісним з Anthropic.

Налаштування через CLI:

- Інтерактивний онбординг:

```bash
openclaw onboard --auth-choice minimax-global-api
# або
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

На шляху потокової передачі, сумісному з Anthropic, OpenClaw тепер за замовчуванням вимикає MiniMax
thinking, якщо ви явно не встановите `thinking` самостійно. Потоковий
ендпоінт MiniMax видає `reasoning_content` у дельта-чанках у стилі OpenAI,
а не у власних блоках thinking Anthropic, що може призвести до витоку внутрішнього міркування
у видимий вивід, якщо не вимкнути це неявно.

### MiniMax M2.7 як запасний варіант (приклад)

**Найкраще для:** збереження найсильнішої сучасної моделі як основної з переходом на MiniMax M2.7 у разі збою.
У прикладі нижче як конкретну основну модель використано Opus; замініть її на бажану сучасну основну модель.

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
3. Виберіть варіант автентифікації **MiniMax**.
4. Коли з'явиться запит, виберіть модель за замовчуванням.

Поточні варіанти автентифікації MiniMax у майстрі/CLI:

- `minimax-global-oauth`
- `minimax-cn-oauth`
- `minimax-global-api`
- `minimax-cn-api`

## Параметри конфігурації

- `models.providers.minimax.baseUrl`: рекомендовано `https://api.minimax.io/anthropic` (сумісний з Anthropic); `https://api.minimax.io/v1` — необов'язковий для payload, сумісних з OpenAI.
- `models.providers.minimax.api`: рекомендовано `anthropic-messages`; `openai-completions` — необов'язковий для payload, сумісних з OpenAI.
- `models.providers.minimax.apiKey`: API-ключ MiniMax (`MINIMAX_API_KEY`).
- `models.providers.minimax.models`: визначає `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost`.
- `agents.defaults.models`: псевдоніми моделей, які ви хочете додати до allowlist.
- `models.mode`: залишайте `merge`, якщо хочете додати MiniMax поряд із вбудованими провайдерами.

## Примітки

- Посилання на моделі залежать від шляху автентифікації:
  - налаштування з API-ключем: `minimax/<model>`
  - налаштування OAuth: `minimax-portal/<model>`
- Стандартна модель чату: `MiniMax-M2.7`
- Альтернативна модель чату: `MiniMax-M2.7-highspeed`
- Для `api: "anthropic-messages"` OpenClaw додає
  `thinking: { type: "disabled" }`, якщо thinking ще не встановлено явно в
  params/config.
- `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на
  `MiniMax-M2.7-highspeed` на шляху потоку, сумісному з Anthropic.
- Онбординг і пряме налаштування через API-ключ записують явні визначення моделей з
  `input: ["text", "image"]` для обох варіантів M2.7
- Вбудований каталог провайдера наразі показує посилання чату як метадані
  лише для тексту, доки не з'явиться явна конфігурація провайдера MiniMax
- API використання Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (потрібен ключ coding plan).
- OpenClaw нормалізує використання coding plan MiniMax до того самого відображення `% left`,
  що й для інших провайдерів. Сирі поля `usage_percent` / `usagePercent` MiniMax
  означають залишок квоти, а не використану квоту, тому OpenClaw інвертує їх.
  Якщо присутні поля на основі лічильників, вони мають пріоритет. Коли API повертає `model_remains`,
  OpenClaw надає перевагу запису моделі чату, за потреби виводить мітку вікна з
  `start_time` / `end_time` і включає вибрану назву моделі
  до мітки плану, щоб вікна coding plan було легше розрізняти.
- Знімки використання трактують `minimax`, `minimax-cn` і `minimax-portal` як
  одну й ту саму поверхню квоти MiniMax та надають перевагу збереженому MiniMax OAuth перед
  запасним використанням ключів середовища Coding Plan.
- Оновіть значення цін у `models.json`, якщо вам потрібне точне відстеження вартості.
- Реферальне посилання для MiniMax Coding Plan (знижка 10%): [https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
- Див. [/concepts/model-providers](/uk/concepts/model-providers) щодо правил провайдерів.
- Використовуйте `openclaw models list`, щоб підтвердити поточний ідентифікатор провайдера, а потім перемкніться за допомогою
  `openclaw models set minimax/MiniMax-M2.7` або
  `openclaw models set minimax-portal/MiniMax-M2.7`.

## Усунення несправностей

### "Unknown model: minimax/MiniMax-M2.7"

Зазвичай це означає, що **провайдер MiniMax не налаштований** (немає відповідного
запису провайдера і не знайдено профілю автентифікації/env key MiniMax). Виправлення для цього
виявлення є в **2026.1.12**. Виправлення:

- Оновіться до **2026.1.12** (або запускайте з вихідного коду `main`), а потім перезапустіть gateway.
- Запустіть `openclaw configure` і виберіть варіант автентифікації **MiniMax**, або
- Додайте відповідний блок `models.providers.minimax` або
  `models.providers.minimax-portal` вручну, або
- Встановіть `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` або профіль автентифікації MiniMax,
  щоб можна було інжектувати відповідний провайдер.

Переконайтеся, що ідентифікатор моделі **чутливий до регістру**:

- шлях API-ключа: `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed`
- шлях OAuth: `minimax-portal/MiniMax-M2.7` або
  `minimax-portal/MiniMax-M2.7-highspeed`

Потім перевірте ще раз за допомогою:

```bash
openclaw models list
```
