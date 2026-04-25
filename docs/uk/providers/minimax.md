---
read_when:
    - Ви хочете моделі MiniMax в OpenClaw
    - Вам потрібні вказівки з налаштування MiniMax
summary: Використання моделей MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T00:30:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 108e0e8de748d0ed68342e1391c7a661136e21e0b255b4afbccf913b6825c6ec
    source_path: providers/minimax.md
    workflow: 15
---

Провайдер MiniMax в OpenClaw за замовчуванням використовує **MiniMax M2.7**.

MiniMax також надає:

- Вбудований синтез мовлення через T2A v2
- Вбудоване розпізнавання зображень через `MiniMax-VL-01`
- Вбудовану генерацію музики через `music-2.5+`
- Вбудований `web_search` через API пошуку MiniMax Coding Plan

Розподіл провайдерів:

| ID провайдера    | Автентифікація | Можливості                                                     |
| ---------------- | -------------- | -------------------------------------------------------------- |
| `minimax`        | API key        | Текст, генерація зображень, розпізнавання зображень, мовлення, вебпошук |
| `minimax-portal` | OAuth          | Текст, генерація зображень, розпізнавання зображень            |

## Вбудований каталог

| Модель                   | Тип              | Опис                                     |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Чат (міркування) | Типова хостингова модель для міркування  |
| `MiniMax-M2.7-highspeed` | Чат (міркування) | Швидший рівень міркування M2.7           |
| `MiniMax-VL-01`          | Vision           | Модель для розпізнавання зображень       |
| `image-01`               | Генерація зображень | Перетворення тексту на зображення та редагування зображення за зображенням |
| `music-2.5+`             | Генерація музики | Типова музична модель                    |
| `music-2.5`              | Генерація музики | Попередній рівень генерації музики       |
| `music-2.0`              | Генерація музики | Застарілий рівень генерації музики       |
| `MiniMax-Hailuo-2.3`     | Генерація відео  | Потоки перетворення тексту на відео та використання зображення як референсу |

## Початок роботи

Виберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Найкраще підходить для:** швидкого налаштування MiniMax Coding Plan через OAuth, ключ API не потрібен.

    <Tabs>
      <Tab title="International">
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
      <Tab title="China">
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
    Налаштування OAuth використовують ID провайдера `minimax-portal`. Посилання на моделі мають формат `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Найкраще підходить для:** хостингового MiniMax з API, сумісним з Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Запустіть онбординг">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Це налаштовує `api.minimax.io` як базову URL-адресу.
          </Step>
          <Step title="Перевірте, що модель доступна">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Запустіть онбординг">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Це налаштовує `api.minimaxi.com` як базову URL-адресу.
          </Step>
          <Step title="Перевірте, що модель доступна">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Приклад конфігурації

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
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
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
    У сумісному з Anthropic потоковому режимі OpenClaw за замовчуванням вимикає thinking для MiniMax, якщо ви явно не встановите `thinking` самостійно. Потоковий ендпоінт MiniMax повертає `reasoning_content` у дельта-чанках у стилі OpenAI замість нативних блоків thinking Anthropic, що може призвести до витоку внутрішніх міркувань у видимий вивід, якщо залишити цю можливість неявно ввімкненою.
    </Warning>

    <Note>
    Налаштування з API key використовують ID провайдера `minimax`. Посилання на моделі мають формат `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Налаштування через `openclaw configure`

Скористайтеся інтерактивним майстром конфігурації, щоб налаштувати MiniMax без редагування JSON:

<Steps>
  <Step title="Запустіть майстер">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Виберіть Model/auth">
    Виберіть у меню **Model/auth**.
  </Step>
  <Step title="Виберіть параметр автентифікації MiniMax">
    Виберіть один із доступних варіантів MiniMax:

    | Варіант автентифікації | Опис |
    | --- | --- |
    | `minimax-global-oauth` | International OAuth (Coding Plan) |
    | `minimax-cn-oauth` | China OAuth (Coding Plan) |
    | `minimax-global-api` | Міжнародний API key |
    | `minimax-cn-api` | API key для Китаю |

  </Step>
  <Step title="Виберіть типову модель">
    Коли з’явиться запит, виберіть типову модель.
  </Step>
</Steps>

## Можливості

### Генерація зображень

Плагін MiniMax реєструє модель `image-01` для інструмента `image_generate`. Вона підтримує:

- **Генерація зображень із тексту** з керуванням співвідношенням сторін
- **Редагування зображення за зображенням** (референс об’єкта) з керуванням співвідношенням сторін
- До **9 вихідних зображень** на запит
- До **1 референсного зображення** на запит редагування
- Підтримувані співвідношення сторін: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

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
моделлю `image-01`. Налаштування з API key використовують `MINIMAX_API_KEY`; налаштування OAuth можуть натомість використовувати
вбудований шлях автентифікації `minimax-portal`.

Коли онбординг або налаштування API key записує явні записи `models.providers.minimax`,
OpenClaw матеріалізує `MiniMax-M2.7` і
`MiniMax-M2.7-highspeed` як текстові чат-моделі. Розпізнавання зображень
експонується окремо через медіапровайдера `MiniMax-VL-01`, що належить плагіну.

<Note>
Див. [Генерація зображень](/uk/tools/image-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою failover.
</Note>

### Генерація музики

Вбудований плагін `minimax` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Типова музична модель: `minimax/music-2.5+`
- Також підтримуються `minimax/music-2.5` і `minimax/music-2.0`
- Керування підказкою: `lyrics`, `instrumental`, `durationSeconds`
- Формат виводу: `mp3`
- Запуски з підтримкою сесій від’єднуються через спільний потік завдань/статусу, зокрема `action: "status"`

Щоб використовувати MiniMax як типовий музичний провайдер:

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
Див. [Генерація музики](/uk/tools/music-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою failover.
</Note>

### Генерація відео

Вбудований плагін `minimax` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Типова відеомодель: `minimax/MiniMax-Hailuo-2.3`
- Режими: перетворення тексту на відео та потоки з одним референсним зображенням
- Підтримує `aspectRatio` і `resolution`

Щоб використовувати MiniMax як типовий відеопровайдер:

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
Див. [Генерація відео](/uk/tools/video-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою failover.
</Note>

### Розпізнавання зображень

Плагін MiniMax реєструє розпізнавання зображень окремо від текстового
каталогу:

| ID провайдера    | Типова модель зображень |
| ---------------- | ----------------------- |
| `minimax`        | `MiniMax-VL-01`         |
| `minimax-portal` | `MiniMax-VL-01`         |

Саме тому автоматична маршрутизація медіа може використовувати розпізнавання зображень MiniMax навіть
коли вбудований каталог текстових провайдерів усе ще показує лише текстові чат-посилання M2.7.

### Вебпошук

Плагін MiniMax також реєструє `web_search` через API пошуку MiniMax Coding Plan.

- ID провайдера: `minimax`
- Структуровані результати: заголовки, URL-адреси, фрагменти, пов’язані запити
- Пріоритетна змінна середовища: `MINIMAX_CODE_PLAN_KEY`
- Псевдонім змінної середовища, що також приймається: `MINIMAX_CODING_API_KEY`
- Резервна сумісність: `MINIMAX_API_KEY`, якщо він уже вказує на токен coding-plan
- Повторне використання регіону: `plugins.entries.minimax.config.webSearch.region`, потім `MINIMAX_API_HOST`, потім базові URL-адреси провайдера MiniMax
- Пошук залишається на ID провайдера `minimax`; налаштування OAuth CN/global однаково можуть опосередковано спрямовувати регіон через `models.providers.minimax-portal.baseUrl`

Конфігурація розміщується в `plugins.entries.minimax.config.webSearch.*`.

<Note>
Див. [Пошук MiniMax](/uk/tools/minimax-search) для повної конфігурації та використання вебпошуку.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Параметри конфігурації">
    | Параметр | Опис |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Рекомендовано `https://api.minimax.io/anthropic` (сумісний з Anthropic); `https://api.minimax.io/v1` є додатковим варіантом для payload, сумісних з OpenAI |
    | `models.providers.minimax.api` | Рекомендовано `anthropic-messages`; `openai-completions` є додатковим варіантом для payload, сумісних з OpenAI |
    | `models.providers.minimax.apiKey` | API key MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Визначає `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Псевдоніми моделей, які ви хочете додати до allowlist |
    | `models.mode` | Залиште `merge`, якщо хочете додати MiniMax поряд із вбудованими |
  </Accordion>

  <Accordion title="Типові значення thinking">
    Для `api: "anthropic-messages"` OpenClaw додає `thinking: { type: "disabled" }`, якщо thinking вже не задано явно в params/config.

    Це запобігає тому, щоб потоковий ендпоінт MiniMax надсилав `reasoning_content` у дельта-чанках у стилі OpenAI, що призводило б до витоку внутрішніх міркувань у видимий вивід.

  </Accordion>

  <Accordion title="Швидкий режим">
    `/fast on` або `params.fastMode: true` переписує `MiniMax-M2.7` на `MiniMax-M2.7-highspeed` у сумісному з Anthropic потоковому шляху.
  </Accordion>

  <Accordion title="Приклад failover">
    **Найкраще підходить для:** використання вашої найсильнішої актуальної моделі нового покоління як основної з переходом на MiniMax M2.7 у разі збою. У прикладі нижче Opus використано як конкретну основну модель; замініть її на бажану вами актуальну основну модель нового покоління.

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

  <Accordion title="Деталі використання Coding Plan">
    - API використання Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (потрібен ключ coding plan).
    - OpenClaw нормалізує використання coding plan MiniMax до того самого відображення `% left`, що й в інших провайдерів. Сирі поля `usage_percent` / `usagePercent` у MiniMax означають залишкову квоту, а не використану квоту, тому OpenClaw інвертує їх. Поля на основі підрахунку мають пріоритет, якщо вони доступні.
    - Коли API повертає `model_remains`, OpenClaw надає перевагу запису chat-моделі, за потреби виводить мітку вікна з `start_time` / `end_time` і включає вибрану назву моделі до мітки плану, щоб вікна coding plan було легше розрізняти.
    - Знімки використання розглядають `minimax`, `minimax-cn` і `minimax-portal` як одну й ту саму поверхню квоти MiniMax та надають перевагу збереженому OAuth MiniMax перед переходом до змінних середовища з ключем Coding Plan.
  </Accordion>
</AccordionGroup>

## Примітки

- Посилання на моделі відповідають шляху автентифікації:
  - Налаштування з API key: `minimax/<model>`
  - Налаштування з OAuth: `minimax-portal/<model>`
- Типова чат-модель: `MiniMax-M2.7`
- Альтернативна чат-модель: `MiniMax-M2.7-highspeed`
- Онбординг і пряме налаштування API key записують визначення лише текстових моделей для обох варіантів M2.7
- Для розпізнавання зображень використовується медіапровайдер `MiniMax-VL-01`, що належить плагіну
- Оновіть значення цін у `models.json`, якщо вам потрібне точне відстеження вартості
- Використовуйте `openclaw models list`, щоб підтвердити поточний ID провайдера, а потім перемкніться за допомогою `openclaw models set minimax/MiniMax-M2.7` або `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Див. [Провайдери моделей](/uk/concepts/model-providers) для правил провайдерів.
</Note>

## Усунення несправностей

<AccordionGroup>
  <Accordion title='"Невідома модель: minimax/MiniMax-M2.7"'>
    Зазвичай це означає, що **провайдер MiniMax не налаштований** (немає відповідного запису провайдера і не знайдено профілю автентифікації/env key MiniMax). Виправлення для цього виявлення є у **2026.1.12**. Виправити можна так:

    - Оновіться до **2026.1.12** (або запустіть із вихідного коду `main`), а потім перезапустіть Gateway.
    - Запустіть `openclaw configure` і виберіть параметр автентифікації **MiniMax**, або
    - Додайте відповідний блок `models.providers.minimax` або `models.providers.minimax-portal` вручну, або
    - Задайте `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` або профіль автентифікації MiniMax, щоб можна було інжектувати відповідний провайдер.

    Переконайтеся, що ID моделі **чутливий до регістру**:

    - Шлях API key: `minimax/MiniMax-M2.7` або `minimax/MiniMax-M2.7-highspeed`
    - Шлях OAuth: `minimax-portal/MiniMax-M2.7` або `minimax-portal/MiniMax-M2.7-highspeed`

    Потім перевірте ще раз за допомогою:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Генерація зображень" href="/uk/tools/image-generation" icon="image">
    Спільні параметри інструмента для зображень і вибір провайдера.
  </Card>
  <Card title="Генерація музики" href="/uk/tools/music-generation" icon="music">
    Спільні параметри музичного інструмента та вибір провайдера.
  </Card>
  <Card title="Генерація відео" href="/uk/tools/video-generation" icon="video">
    Спільні параметри відеоінструмента та вибір провайдера.
  </Card>
  <Card title="Пошук MiniMax" href="/uk/tools/minimax-search" icon="magnifying-glass">
    Конфігурація вебпошуку через MiniMax Coding Plan.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Загальне усунення несправностей і FAQ.
  </Card>
</CardGroup>
