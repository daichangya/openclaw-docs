---
read_when:
    - Ви хочете використовувати моделі MiniMax в OpenClaw
    - Вам потрібен посібник із налаштування MiniMax
summary: Використання моделей MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-23T23:05:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: f2729e9e9f866e66a6587d6c58f6116abae2fc09a1f50e5038e1c25bed0a82f2
    source_path: providers/minimax.md
    workflow: 15
---

Провайдер MiniMax в OpenClaw типово використовує **MiniMax M2.7**.

MiniMax також надає:

- Вбудований синтез мовлення через T2A v2
- Вбудоване розуміння зображень через `MiniMax-VL-01`
- Вбудовану генерацію музики через `music-2.5+`
- Вбудований `web_search` через API пошуку MiniMax Coding Plan

Розподіл провайдерів:

| ID провайдера    | Auth    | Можливості                                                      |
| ---------------- | ------- | --------------------------------------------------------------- |
| `minimax`        | API key | Текст, генерація зображень, розуміння зображень, мовлення, вебпошук |
| `minimax-portal` | OAuth   | Текст, генерація зображень, розуміння зображень                 |

## Вбудований каталог

| Модель                   | Тип              | Опис                                     |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Типова hosted reasoning-модель           |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Швидший reasoning-рівень M2.7            |
| `MiniMax-VL-01`          | Vision           | Модель розуміння зображень               |
| `image-01`               | Генерація зображень | Генерація зображення з тексту та редагування зображення до зображення |
| `music-2.5+`             | Генерація музики | Типова модель музики                     |
| `music-2.5`              | Генерація музики | Попередній рівень генерації музики       |
| `music-2.0`              | Генерація музики | Legacy-рівень генерації музики           |
| `MiniMax-Hailuo-2.3`     | Генерація відео  | Потоки text-to-video та image reference  |

## Початок роботи

Виберіть бажаний спосіб auth і виконайте кроки налаштування.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Найкраще для:** швидкого налаштування через MiniMax Coding Plan з OAuth, без потреби в API key.

    <Tabs>
      <Tab title="Міжнародний">
        <Steps>
          <Step title="Запустіть онбординг">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Це виконує автентифікацію через `api.minimax.io`.
          </Step>
          <Step title="Перевірте, що модель доступна">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Китай">
        <Steps>
          <Step title="Запустіть онбординг">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Це виконує автентифікацію через `api.minimaxi.com`.
          </Step>
          <Step title="Перевірте, що модель доступна">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Конфігурації OAuth використовують id провайдера `minimax-portal`. Посилання на моделі мають форму `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Найкраще для:** hosted MiniMax із API, сумісним з Anthropic.

    <Tabs>
      <Tab title="Міжнародний">
        <Steps>
          <Step title="Запустіть онбординг">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Це налаштовує `api.minimax.io` як base URL.
          </Step>
          <Step title="Перевірте, що модель доступна">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Китай">
        <Steps>
          <Step title="Запустіть онбординг">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Це налаштовує `api.minimaxi.com` як base URL.
          </Step>
          <Step title="Перевірте, що модель доступна">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Приклад config

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

    <Warning>
    На шляху потокової передачі, сумісному з Anthropic, OpenClaw типово вимикає thinking MiniMax, якщо ви явно не задасте `thinking` самі. Streaming-endpoint MiniMax виводить `reasoning_content` у delta-чанках у стилі OpenAI замість native-блоків thinking Anthropic, що може призвести до витоку внутрішнього reasoning у видимий вивід, якщо залишити це неявно увімкненим.
    </Warning>

    <Note>
    Конфігурації з API key використовують id провайдера `minimax`. Посилання на моделі мають форму `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Налаштування через `openclaw configure`

Використовуйте інтерактивний майстер config, щоб налаштувати MiniMax без редагування JSON:

<Steps>
  <Step title="Запустіть майстер">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Виберіть Model/auth">
    У меню виберіть **Model/auth**.
  </Step>
  <Step title="Виберіть варіант auth MiniMax">
    Виберіть один із доступних варіантів MiniMax:

    | Варіант auth | Опис |
    | --- | --- |
    | `minimax-global-oauth` | Міжнародний OAuth (Coding Plan) |
    | `minimax-cn-oauth` | OAuth для Китаю (Coding Plan) |
    | `minimax-global-api` | Міжнародний API key |
    | `minimax-cn-api` | API key для Китаю |

  </Step>
  <Step title="Виберіть типову модель">
    Коли з’явиться запит, виберіть вашу типову модель.
  </Step>
</Steps>

## Можливості

### Генерація зображень

Plugin MiniMax реєструє модель `image-01` для інструмента `image_generate`. Вона підтримує:

- **Генерація зображень із тексту** з керуванням aspect ratio
- **Редагування зображення за зображенням** (reference об’єкта) з керуванням aspect ratio
- До **9 вихідних зображень** на запит
- До **1 reference-зображення** на запит редагування
- Підтримувані aspect ratio: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Щоб використовувати MiniMax для генерації зображень, задайте його як провайдера генерації зображень:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Plugin використовує той самий `MINIMAX_API_KEY` або OAuth auth, що й текстові моделі. Додаткова конфігурація не потрібна, якщо MiniMax уже налаштовано.

І `minimax`, і `minimax-portal` реєструють `image_generate` з тією самою
моделлю `image-01`. Конфігурації з API key використовують `MINIMAX_API_KEY`; конфігурації з OAuth можуть
замість цього використовувати вбудований шлях auth `minimax-portal`.

Коли онбординг або налаштування з API key записує явні записи `models.providers.minimax`,
OpenClaw матеріалізує `MiniMax-M2.7` і
`MiniMax-M2.7-highspeed` з `input: ["text", "image"]`.

Сам вбудований bundled-каталог текстових моделей MiniMax залишається метаданими лише для тексту, доки
не з’явиться явна конфігурація провайдера. Розуміння зображень відкривається окремо
через медіапровайдер `MiniMax-VL-01`, що належить Plugin-у.

<Note>
Див. [Генерація зображень](/uk/tools/image-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

### Генерація музики

Вбудований Plugin `minimax` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Типова музична модель: `minimax/music-2.5+`
- Також підтримує `minimax/music-2.5` і `minimax/music-2.0`
- Керування prompt: `lyrics`, `instrumental`, `durationSeconds`
- Формат виводу: `mp3`
- Запуски на основі сесій від’єднуються через спільний потік task/status, включно з `action: "status"`

Щоб використовувати MiniMax як типового провайдера музики:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
Див. [Генерація музики](/uk/tools/music-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

### Генерація відео

Вбудований Plugin `minimax` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Типова відеомодель: `minimax/MiniMax-Hailuo-2.3`
- Режими: text-to-video і потоки з одним reference-зображенням
- Підтримує `aspectRatio` і `resolution`

Щоб використовувати MiniMax як типового провайдера відео:

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

<Note>
Див. [Генерація відео](/uk/tools/video-generation) щодо спільних параметрів інструмента, вибору провайдера та поведінки failover.
</Note>

### Розуміння зображень

Plugin MiniMax реєструє розуміння зображень окремо від текстового
каталогу:

| ID провайдера    | Типова модель зображень |
| ---------------- | ----------------------- |
| `minimax`        | `MiniMax-VL-01`         |
| `minimax-portal` | `MiniMax-VL-01`         |

Саме тому автоматична маршрутизація медіа може використовувати розуміння зображень MiniMax навіть
тоді, коли bundled-каталог текстового провайдера все ще показує лише текстові посилання на чат M2.7.

### Вебпошук

Plugin MiniMax також реєструє `web_search` через API пошуку MiniMax Coding Plan.

- ID провайдера: `minimax`
- Структуровані результати: заголовки, URL, фрагменти, пов’язані запити
- Бажана змінна середовища: `MINIMAX_CODE_PLAN_KEY`
- Прийнятий псевдонім env: `MINIMAX_CODING_API_KEY`
- Fallback для сумісності: `MINIMAX_API_KEY`, коли він уже вказує на токен coding-plan
- Повторне використання регіону: `plugins.entries.minimax.config.webSearch.region`, потім `MINIMAX_API_HOST`, потім base URL провайдерів MiniMax
- Пошук залишається на ID провайдера `minimax`; конфігурація OAuth CN/global усе ще може непрямо спрямовувати регіон через `models.providers.minimax-portal.baseUrl`

Конфігурація міститься в `plugins.entries.minimax.config.webSearch.*`.

<Note>
Повну конфігурацію та використання вебпошуку див. у [MiniMax Search](/uk/tools/minimax-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Параметри конфігурації">
    | Параметр | Опис |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Надавайте перевагу `https://api.minimax.io/anthropic` (сумісний з Anthropic); `https://api.minimax.io/v1` необов’язковий для payload, сумісних з OpenAI |
    | `models.providers.minimax.api` | Надавайте перевагу `anthropic-messages`; `openai-completions` необов’язковий для payload, сумісних з OpenAI |
    | `models.providers.minimax.apiKey` | API key MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Визначайте `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Моделі-псевдоніми, які ви хочете додати до allowlist |
    | `models.mode` | Залишайте `merge`, якщо хочете додати MiniMax поряд із вбудованими |
  </Accordion>

  <Accordion title="Типові значення thinking">
    Для `api: "anthropic-messages"` OpenClaw інжектує `thinking: { type: "disabled" }`, якщо thinking уже не задано явно в params/config.

    Це не дає streaming-endpoint-у MiniMax виводити `reasoning_content` у delta-чанках у стилі OpenAI, що призвело б до витоку внутрішнього reasoning у видимий вивід.

  </Accordion>

  <Accordion title="Швидкий режим">
    `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed` на шляху потоку, сумісного з Anthropic.
  </Accordion>

  <Accordion title="Приклад fallback">
    **Найкраще для:** зберігати вашу найсильнішу модель останнього покоління як primary і переходити на MiniMax M2.7 у разі збою. У прикладі нижче як конкретний primary використано Opus; замініть його на бажану primary-модель останнього покоління.

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

  </Accordion>

  <Accordion title="Подробиці використання Coding Plan">
    - API використання Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (потребує ключа coding plan).
    - OpenClaw нормалізує використання MiniMax coding-plan до того самого відображення `% left`, що й в інших провайдерів. Сирі поля MiniMax `usage_percent` / `usagePercent` означають залишкову квоту, а не використану, тому OpenClaw інвертує їх. Якщо присутні поля з підрахунками, вони мають пріоритет.
    - Коли API повертає `model_remains`, OpenClaw надає перевагу запису chat-моделі, за потреби виводить мітку вікна з `start_time` / `end_time` і включає вибрану назву моделі до мітки plan, щоб вікна coding-plan було легше розрізняти.
    - Знімки використання трактують `minimax`, `minimax-cn` і `minimax-portal` як ту саму поверхню квоти MiniMax і надають перевагу збереженому OAuth MiniMax, перш ніж переходити до env vars ключа Coding Plan.
  </Accordion>
</AccordionGroup>

## Примітки

- Посилання на моделі відповідають шляху auth:
  - Налаштування з API key: `minimax/<model>`
  - Налаштування з OAuth: `minimax-portal/<model>`
- Типова chat-модель: `MiniMax-M2.7`
- Альтернативна chat-модель: `MiniMax-M2.7-highspeed`
- Онбординг і пряме налаштування з API key записують явні визначення моделей з `input: ["text", "image"]` для обох варіантів M2.7
- Bundled-каталог провайдерів наразі відкриває посилання на chat як метадані лише для тексту, доки не з’явиться явна конфігурація провайдера MiniMax
- Оновіть значення цін у `models.json`, якщо вам потрібне точне відстеження вартості
- Використовуйте `openclaw models list`, щоб підтвердити поточний id провайдера, а потім перемкніть його через `openclaw models set minimax/MiniMax-M2.7` або `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Правила провайдерів див. у [Провайдери моделей](/uk/concepts/model-providers).
</Note>

## Усунення несправностей

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Зазвичай це означає, що **провайдер MiniMax не налаштовано** (немає відповідного запису провайдера і не знайдено профілю auth/env key MiniMax). Виправлення для цього виявлення є у **2026.1.12**. Виправити можна так:

    - Оновіться до **2026.1.12** (або запускайте з вихідного `main`), а потім перезапустіть gateway.
    - Запустіть `openclaw configure` і виберіть варіант auth **MiniMax**, або
    - Додайте вручну відповідний блок `models.providers.minimax` або `models.providers.minimax-portal`, або
    - Задайте `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` або профіль auth MiniMax, щоб можна було інжектувати відповідний провайдер.

    Переконайтеся, що id моделі **чутливий до регістру**:

    - Шлях API key: `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed`
    - Шлях OAuth: `minimax-portal/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7-highspeed`

    Потім перевірте ще раз за допомогою:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента зображень і вибір провайдера.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри інструмента музики і вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри інструмента відео і вибір провайдера.
  </Card>
  <Card title="MiniMax Search" href="/uk/tools/minimax-search" icon="magnifying-glass">
    Конфігурація вебпошуку через MiniMax Coding Plan.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
