---
read_when:
    - Ви хочете моделі MiniMax в OpenClaw
    - Вам потрібні вказівки з налаштування MiniMax
summary: Використання моделей MiniMax в OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-25T04:07:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 202b0852f3f1f484193d6f9a019b179c807dc13d7bed497f1122c36eae03e980
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
| `MiniMax-M2.7`           | Чат (міркування) | Типова розміщена модель для міркування   |
| `MiniMax-M2.7-highspeed` | Чат (міркування) | Швидший рівень міркування M2.7           |
| `MiniMax-VL-01`          | Vision           | Модель розпізнавання зображень           |
| `image-01`               | Генерація зображень | Перетворення тексту на зображення та редагування зображення за зображенням |
| `music-2.5+`             | Генерація музики | Типова модель музики                     |
| `music-2.5`              | Генерація музики | Попередній рівень генерації музики       |
| `music-2.0`              | Генерація музики | Застарілий рівень генерації музики       |
| `MiniMax-Hailuo-2.3`     | Генерація відео  | Потоки «текст у відео» та з опорним зображенням |

## Початок роботи

Оберіть бажаний спосіб автентифікації та виконайте кроки налаштування.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Найкраще для:** швидкого налаштування MiniMax Coding Plan через OAuth, без потреби в API key.

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
    Налаштування OAuth використовують ID провайдера `minimax-portal`. Посилання на моделі мають формат `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Найкраще для:** розміщеного MiniMax з API, сумісним з Anthropic.

    <Tabs>
      <Tab title="Міжнародний">
        <Steps>
          <Step title="Запустіть онбординг">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Це налаштовує `api.minimax.io` як базовий URL.
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

            Це налаштовує `api.minimaxi.com` як базовий URL.
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
    У сумісному з Anthropic потоковому режимі OpenClaw за замовчуванням вимикає мислення MiniMax, якщо ви явно не встановите `thinking` самостійно. Потокова кінцева точка MiniMax надсилає `reasoning_content` у дельта-фрагментах у стилі OpenAI замість нативних блоків thinking Anthropic, що може призвести до витоку внутрішнього міркування у видимий вивід, якщо залишити це неявно ввімкненим.
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
    У меню виберіть **Model/auth**.
  </Step>
  <Step title="Оберіть варіант автентифікації MiniMax">
    Виберіть один із доступних варіантів MiniMax:

    | Варіант автентифікації | Опис |
    | --- | --- |
    | `minimax-global-oauth` | Міжнародний OAuth (Coding Plan) |
    | `minimax-cn-oauth` | OAuth для Китаю (Coding Plan) |
    | `minimax-global-api` | Міжнародний API key |
    | `minimax-cn-api` | API key для Китаю |

  </Step>
  <Step title="Виберіть модель за замовчуванням">
    Коли з’явиться запит, виберіть модель за замовчуванням.
  </Step>
</Steps>

## Можливості

### Генерація зображень

Plugin MiniMax реєструє модель `image-01` для інструмента `image_generate`. Підтримується:

- **Генерація зображень із тексту** з керуванням співвідношенням сторін
- **Редагування зображення за зображенням** (опорний об’єкт) з керуванням співвідношенням сторін
- До **9 вихідних зображень** на запит
- До **1 опорного зображення** на запит редагування
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

Plugin використовує той самий `MINIMAX_API_KEY` або OAuth-автентифікацію, що й текстові моделі. Додаткова конфігурація не потрібна, якщо MiniMax уже налаштовано.

І `minimax`, і `minimax-portal` реєструють `image_generate` з тією самою
моделлю `image-01`. Налаштування з API key використовують `MINIMAX_API_KEY`; налаштування OAuth можуть натомість використовувати
вбудований шлях автентифікації `minimax-portal`.

Коли онбординг або налаштування API key записує явні записи `models.providers.minimax`,
OpenClaw матеріалізує `MiniMax-M2.7` і
`MiniMax-M2.7-highspeed` як текстові чат-моделі. Розпізнавання зображень
надається окремо через медіапровайдер `MiniMax-VL-01`, що належить plugin.

<Note>
Див. [Генерація зображень](/uk/tools/image-generation), щоб ознайомитися зі спільними параметрами інструмента, вибором провайдера та поведінкою failover.
</Note>

### Перетворення тексту на мовлення

Вбудований plugin `minimax` реєструє MiniMax T2A v2 як провайдера мовлення для
`messages.tts`.

- Типова модель TTS: `speech-2.8-hd`
- Типовий голос: `English_expressive_narrator`
- Звичайні аудіовкладення залишаються у форматі MP3.
- Цілі voice-note, такі як Feishu і Telegram, перекодовуються з MP3 MiniMax
  у 48kHz Opus через `ffmpeg`, оскільки API файлів Feishu/Lark
  приймає лише `file_type: "opus"` для нативних аудіоповідомлень.
- MiniMax T2A приймає дробові значення `speed` і `vol`, але `pitch` надсилається як
  ціле число; OpenClaw відкидає дробову частину значень `pitch` перед запитом до API.

| Налаштування                             | Змінна середовища      | Типове значення            | Опис                                 |
| ---------------------------------------- | ---------------------- | -------------------------- | ------------------------------------ |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`   | Хост API MiniMax T2A.                |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`            | ID моделі TTS.                       |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID голосу, що використовується для мовленнєвого виводу. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                      | Швидкість відтворення, `0.5..2.0`.   |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                      | Гучність, `(0, 10]`.                 |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                        | Цілочисельне зміщення тону, `-12..12`. |

### Генерація музики

Вбудований plugin `minimax` також реєструє генерацію музики через спільний
інструмент `music_generate`.

- Типова музична модель: `minimax/music-2.5+`
- Також підтримуються `minimax/music-2.5` і `minimax/music-2.0`
- Керування prompt: `lyrics`, `instrumental`, `durationSeconds`
- Формат виводу: `mp3`
- Запуски із session-відстеженням відокремлюються через спільний потік завдань/статусу, включно з `action: "status"`

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

Вбудований plugin `minimax` також реєструє генерацію відео через спільний
інструмент `video_generate`.

- Типова відеомодель: `minimax/MiniMax-Hailuo-2.3`
- Режими: «текст у відео» та потоки з одним опорним зображенням
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

Plugin MiniMax реєструє розпізнавання зображень окремо від текстового
каталогу:

| ID провайдера    | Типова модель зображень |
| ---------------- | ----------------------- |
| `minimax`        | `MiniMax-VL-01`         |
| `minimax-portal` | `MiniMax-VL-01`         |

Саме тому автоматична маршрутизація медіа може використовувати розпізнавання зображень MiniMax навіть
тоді, коли вбудований каталог текстового провайдера все ще показує лише текстові посилання чату M2.7.

### Вебпошук

Plugin MiniMax також реєструє `web_search` через API пошуку MiniMax Coding Plan.

- ID провайдера: `minimax`
- Структуровані результати: заголовки, URL, фрагменти, пов’язані запити
- Бажана змінна середовища: `MINIMAX_CODE_PLAN_KEY`
- Прийнятний псевдонім змінної середовища: `MINIMAX_CODING_API_KEY`
- Сумісний запасний варіант: `MINIMAX_API_KEY`, якщо він уже вказує на токен coding plan
- Повторне використання регіону: `plugins.entries.minimax.config.webSearch.region`, потім `MINIMAX_API_HOST`, потім базові URL провайдера MiniMax
- Пошук залишається на ID провайдера `minimax`; налаштування OAuth CN/global усе ще можуть опосередковано спрямовувати регіон через `models.providers.minimax-portal.baseUrl`

Конфігурація розміщується в `plugins.entries.minimax.config.webSearch.*`.

<Note>
Див. [MiniMax Search](/uk/tools/minimax-search), щоб ознайомитися з повною конфігурацією та використанням вебпошуку.
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Параметри конфігурації">
    | Параметр | Опис |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Рекомендовано `https://api.minimax.io/anthropic` (сумісний з Anthropic); `https://api.minimax.io/v1` є необов’язковим для навантажень, сумісних з OpenAI |
    | `models.providers.minimax.api` | Рекомендовано `anthropic-messages`; `openai-completions` є необов’язковим для навантажень, сумісних з OpenAI |
    | `models.providers.minimax.apiKey` | API key MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Визначає `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Псевдоніми моделей, які ви хочете додати до allowlist |
    | `models.mode` | Залиште `merge`, якщо хочете додати MiniMax поряд із вбудованими |
  </Accordion>

  <Accordion title="Типові значення thinking">
    Для `api: "anthropic-messages"` OpenClaw додає `thinking: { type: "disabled" }`, якщо thinking ще не задано явно в params/config.

    Це запобігає тому, щоб потокова кінцева точка MiniMax надсилала `reasoning_content` у дельта-фрагментах у стилі OpenAI, що призвело б до витоку внутрішнього міркування у видимий вивід.

  </Accordion>

  <Accordion title="Швидкий режим">
    `/fast on` або `params.fastMode: true` замінює `MiniMax-M2.7` на `MiniMax-M2.7-highspeed` у сумісному з Anthropic потоковому шляху.
  </Accordion>

  <Accordion title="Приклад failover">
    **Найкраще для:** зберегти вашу найсильнішу основну модель останнього покоління як primary і перейти на MiniMax M2.7 у разі відмови. У прикладі нижче як конкретну primary використано Opus; замініть її на бажану primary модель останнього покоління.

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
    - OpenClaw нормалізує використання coding plan MiniMax до того самого відображення `% left`, що й в інших провайдерів. Необроблені поля MiniMax `usage_percent` / `usagePercent` — це квота, що залишилася, а не вже використана квота, тому OpenClaw інвертує їх. Поля на основі лічильників мають пріоритет, якщо вони присутні.
    - Коли API повертає `model_remains`, OpenClaw віддає перевагу запису чат-моделі, за потреби виводить мітку вікна з `start_time` / `end_time` і включає вибрану назву моделі в мітку плану, щоб вікна coding plan було легше розрізняти.
    - Знімки використання трактують `minimax`, `minimax-cn` і `minimax-portal` як одну й ту саму поверхню квоти MiniMax і віддають перевагу збереженому OAuth MiniMax, перш ніж переходити до змінних середовища ключа Coding Plan.
  </Accordion>
</AccordionGroup>

## Примітки

- Посилання на моделі відповідають шляху автентифікації:
  - Налаштування з API key: `minimax/<model>`
  - Налаштування з OAuth: `minimax-portal/<model>`
- Типова чат-модель: `MiniMax-M2.7`
- Альтернативна чат-модель: `MiniMax-M2.7-highspeed`
- Онбординг і пряме налаштування API key записують визначення лише текстових моделей для обох варіантів M2.7
- Для розпізнавання зображень використовується медіапровайдер `MiniMax-VL-01`, що належить plugin
- Оновіть значення цін у `models.json`, якщо вам потрібне точне відстеження вартості
- Використовуйте `openclaw models list`, щоб підтвердити поточний ID провайдера, а потім перемкніть його через `openclaw models set minimax/MiniMax-M2.7` або `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Реферальне посилання для MiniMax Coding Plan (знижка 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Див. [Провайдери моделей](/uk/concepts/model-providers), щоб ознайомитися з правилами для провайдерів.
</Note>

## Усунення несправностей

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Зазвичай це означає, що **провайдер MiniMax не налаштовано** (немає відповідного запису провайдера і не знайдено профілю автентифікації/env key MiniMax). Виправлення для цього виявлення входить до **2026.1.12**. Виправити можна так:

    - Оновіть до **2026.1.12** (або запустіть із вихідного коду `main`), а потім перезапустіть Gateway.
    - Запустіть `openclaw configure` і виберіть варіант автентифікації **MiniMax**, або
    - Додайте відповідний блок `models.providers.minimax` або `models.providers.minimax-portal` вручну, або
    - Встановіть `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` або профіль автентифікації MiniMax, щоб можна було підставити відповідний провайдер.

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
