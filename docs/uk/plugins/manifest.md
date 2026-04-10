---
read_when:
    - Ви створюєте plugin для OpenClaw
    - Вам потрібно постачати схему конфігурації plugin або налагоджувати помилки валідації plugin
summary: Вимоги до маніфесту plugin + JSON schema (сувора валідація конфігурації)
title: Маніфест plugin
x-i18n:
    generated_at: "2026-04-10T13:58:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6b254c121d1eb5ea19adbd4148243cf47339c960442ab1ca0e0bfd52e0154c88
    source_path: plugins/manifest.md
    workflow: 15
---

# Маніфест plugin (`openclaw.plugin.json`)

Ця сторінка стосується лише **власного маніфесту plugin OpenClaw**.

Сумісні макети бандлів описані в розділі [Plugin bundles](/uk/plugins/bundles).

Сумісні формати бандлів використовують інші файли маніфесту:

- Бандл Codex: `.codex-plugin/plugin.json`
- Бандл Claude: `.claude-plugin/plugin.json` або стандартний макет компонентів Claude
  без маніфесту
- Бандл Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично визначає ці макети бандлів, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних бандлів OpenClaw наразі читає метадані бандла разом із оголошеними
коренями Skills, коренями команд Claude, значеннями за замовчуванням із `settings.json` бандла Claude,
значеннями LSP за замовчуванням для бандла Claude та підтримуваними наборами хуків, якщо макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен власний plugin OpenClaw **має** постачатися з файлом `openclaw.plugin.json` у
**корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду plugin**. Відсутні або невалідні маніфести вважаються
помилками plugin і блокують валідацію конфігурації.

Повний посібник із системи plugin дивіться тут: [Plugins](/uk/tools/plugin).
Для власної моделі можливостей і поточних рекомендацій щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає до завантаження коду
вашого plugin.

Використовуйте його для:

- ідентифікації plugin
- валідації конфігурації
- метаданих auth і онбордингу, які мають бути доступні без запуску середовища виконання plugin
- метаданих псевдонімів і автоувімкнення, які мають розв’язуватися до завантаження середовища виконання plugin
- метаданих володіння скороченими сімействами моделей, які мають автоматично активувати
  plugin до завантаження середовища виконання
- статичних знімків володіння можливостями, що використовуються для сумісного зв’язування bundled plugin і
  покриття контрактів
- метаданих конфігурації для каналів, які мають об’єднуватися в поверхні каталогу та валідації
  без завантаження середовища виконання
- підказок UI для конфігурації

Не використовуйте його для:

- реєстрації поведінки середовища виконання
- оголошення точок входу коду
- метаданих встановлення npm

Для цього призначені код вашого plugin і `package.json`.

## Мінімальний приклад

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## Розширений приклад

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## Довідник полів верхнього рівня

| Поле                                | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                              |
| ----------------------------------- | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Так         | `string`                         | Канонічний ідентифікатор plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                    |
| `configSchema`                      | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                        |
| `enabledByDefault`                  | Ні          | `true`                           | Позначає bundled plugin як увімкнений за замовчуванням. Не вказуйте це поле або встановіть будь-яке значення, відмінне від `true`, щоб plugin лишався вимкненим за замовчуванням.                          |
| `legacyPluginIds`                   | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id plugin.                                                                                                                                            |
| `autoEnableWhenConfiguredProviders` | Ні          | `string[]`                       | Ідентифікатори provider, які мають автоматично вмикати цей plugin, коли auth, config або посилання на моделі згадують їх.                                                                                  |
| `kind`                              | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип plugin, що використовується `plugins.slots.*`.                                                                                                                                   |
| `channels`                          | Ні          | `string[]`                       | Ідентифікатори каналів, що належать цьому plugin. Використовуються для виявлення та валідації конфігурації.                                                                                                |
| `providers`                         | Ні          | `string[]`                       | Ідентифікатори provider, що належать цьому plugin.                                                                                                                                                          |
| `modelSupport`                      | Ні          | `object`                         | Скорочені метадані сімейств моделей, що належать маніфесту і використовуються для автоматичного завантаження plugin до запуску середовища виконання.                                                       |
| `cliBackends`                       | Ні          | `string[]`                       | Ідентифікатори бекендів інференсу CLI, що належать цьому plugin. Використовуються для автоактивації під час запуску з явних посилань у конфігурації.                                                      |
| `commandAliases`                    | Ні          | `object[]`                       | Імена команд, що належать цьому plugin і мають генерувати діагностику конфігурації та CLI з урахуванням plugin до завантаження середовища виконання.                                                       |
| `providerAuthEnvVars`               | Ні          | `Record<string, string[]>`       | Недорогі метадані env для auth provider, які OpenClaw може перевіряти без завантаження коду plugin.                                                                                                        |
| `providerAuthAliases`               | Ні          | `Record<string, string>`         | Ідентифікатори provider, які мають повторно використовувати інший id provider для пошуку auth, наприклад provider для кодування, який ділить базовий API key provider і профілі auth.                    |
| `channelEnvVars`                    | Ні          | `Record<string, string[]>`       | Недорогі метадані env для каналів, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для конфігурації каналів або поверхонь auth на основі env, які мають бачити загальні допоміжні засоби запуску/конфігурації. |
| `providerAuthChoices`               | Ні          | `object[]`                       | Недорогі метадані варіантів auth для пікерів онбордингу, визначення пріоритетних provider і простого зв’язування прапорців CLI.                                                                            |
| `contracts`                         | Ні          | `object`                         | Статичний знімок bundled capability для speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння tools. |
| `channelConfigs`                    | Ні          | `Record<string, object>`         | Метадані конфігурації каналів, що належать маніфесту та об’єднуються в поверхні виявлення і валідації до завантаження середовища виконання.                                                               |
| `skills`                            | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня plugin.                                                                                                                                                   |
| `name`                              | Ні          | `string`                         | Зручна для читання назва plugin.                                                                                                                                                                             |
| `description`                       | Ні          | `string`                         | Короткий опис, що показується в поверхнях plugin.                                                                                                                                                            |
| `version`                           | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                  |
| `uiHints`                           | Ні          | `Record<string, object>`         | Підписи UI, заповнювачі та підказки чутливості для полів конфігурації.                                                                                                                                      |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або auth.
OpenClaw читає це до завантаження середовища виконання provider.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Ідентифікатор provider, до якого належить цей варіант.                                                   |
| `method`              | Так         | `string`                                        | Ідентифікатор методу auth, до якого треба маршрутизувати.                                                |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор варіанта auth, який використовується в потоках онбордингу та CLI.              |
| `choiceLabel`         | Ні          | `string`                                        | Підпис для користувача. Якщо не вказано, OpenClaw використовує `choiceId`.                               |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для пікера.                                                                    |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних пікерах, керованих помічником.                          |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант у пікерах помічника, але все ще дозволяє ручний вибір через CLI.                        |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори варіантів, які мають перенаправляти користувачів до цього варіанта-замінника. |
| `groupId`             | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для групування пов’язаних варіантів.                                  |
| `groupLabel`          | Ні          | `string`                                        | Підпис для цієї групи, видимий користувачу.                                                              |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                     |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ опції для простих потоків auth з одним прапорцем.                                        |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                    |
| `cliOption`           | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                           |
| `cliDescription`      | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                                 |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з’являтися цей варіант. Якщо не вказано, за замовчуванням це `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє ім’ям команди середовища виконання, яке користувачі можуть
помилково помістити в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
використовує ці метадані для діагностики без імпорту коду середовища виконання plugin.

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| Поле         | Обов’язкове | Тип               | Що воно означає                                                                  |
| ------------ | ----------- | ----------------- | -------------------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, що належить цьому plugin.                                         |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не як кореневу команду CLI.          |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід підказати для операцій CLI, якщо вона існує. |

## Довідник `uiHints`

`uiHints` — це мапа від назв полів конфігурації до невеликих підказок для рендерингу.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Кожна підказка для поля може містити:

| Поле          | Тип        | Що воно означає                          |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Підпис поля для користувача.             |
| `help`        | `string`   | Короткий допоміжний текст.               |
| `tags`        | `string[]` | Необов’язкові теги UI.                   |
| `advanced`    | `boolean`  | Позначає поле як розширене.              |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.   |
| `placeholder` | `string`   | Текст заповнювача для полів форми.       |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
прочитати без імпорту середовища виконання plugin.

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Кожен список є необов’язковим:

| Поле                             | Тип        | Що воно означає                                             |
| -------------------------------- | ---------- | ----------------------------------------------------------- |
| `speechProviders`                | `string[]` | Ідентифікатори speech provider, що належать цьому plugin.   |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори provider транскрипції в реальному часі, що належать цьому plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори provider голосу в реальному часі, що належать цьому plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори provider розуміння медіа, що належать цьому plugin. |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори provider генерації зображень, що належать цьому plugin. |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори provider генерації відео, що належать цьому plugin. |
| `webFetchProviders`              | `string[]` | Ідентифікатори provider отримання веб-даних, що належать цьому plugin. |
| `webSearchProviders`             | `string[]` | Ідентифікатори provider вебпошуку, що належать цьому plugin. |
| `tools`                          | `string[]` | Назви agent tools, що належать цьому plugin для bundled перевірок контрактів. |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли plugin каналу потребує недорогих метаданих конфігурації до
завантаження середовища виконання.

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Кожен запис каналу може містити:

| Поле          | Тип                      | Що воно означає                                                                                |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису конфігурації каналу. |
| `uiHints`     | `Record<string, object>` | Необов’язкові підписи UI/заповнювачі/підказки чутливості для цього розділу конфігурації каналу. |
| `label`       | `string`                 | Підпис каналу, що об’єднується в поверхні вибору та інспекції, коли метадані середовища виконання ще не готові. |
| `description` | `string`                 | Короткий опис каналу для поверхонь інспекції та каталогу.                                      |
| `preferOver`  | `string[]`               | Ідентифікатори застарілих або менш пріоритетних plugin, які цей канал має перевершувати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш plugin provider з
скорочених ідентифікаторів моделей, таких як `gpt-5.4` або `claude-sonnet-4.6`, до того, як
завантажиться середовище виконання plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий пріоритет:

- явні посилання `provider/model` використовують метадані маніфесту `providers`, що належать власнику
- `modelPatterns` мають вищий пріоритет за `modelPrefixes`
- якщо збігаються один не-bundled plugin і один bundled plugin, перемагає не-bundled
  plugin
- решта неоднозначностей ігноруються, доки користувач або конфігурація не вкажуть provider

Поля:

| Поле            | Тип        | Що воно означає                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими ідентифікаторами моделей. |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими ідентифікаторами моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня не рекомендовані. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` до `contracts`; звичайне
завантаження маніфесту більше не розглядає ці поля верхнього рівня як
володіння можливостями.

## Маніфест порівняно з package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого його використовувати                                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів auth і підказки UI, які мають існувати до запуску коду plugin            |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для точок входу, обмежень встановлення, налаштування або метаданих каталогу |

Якщо ви не впевнені, куди належить певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw має знати це до завантаження коду plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів точок входу або поведінки встановлення npm, помістіть це в `package.json`

### Поля package.json, які впливають на виявлення

Деякі метадані plugin до запуску середовища виконання навмисно зберігаються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує власні точки входу plugin.                                                                                                          |
| `openclaw.setupEntry`                                             | Легка точка входу лише для налаштування, що використовується під час онбордингу та відкладеного запуску каналу.                             |
| `openclaw.channel`                                                | Недорогі метадані каталогу каналів, як-от підписи, шляхи до документації, псевдоніми та текст для вибору.                                  |
| `openclaw.channel.configuredState`                                | Недорогі метадані перевірки налаштованого стану, які можуть відповісти на питання «чи вже існує налаштування лише через env?» без завантаження повного середовища виконання каналу. |
| `openclaw.channel.persistedAuthState`                             | Недорогі метадані перевірки збереженого auth, які можуть відповісти на питання «чи вже десь виконано вхід?» без завантаження повного середовища виконання каналу. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки для встановлення/оновлення bundled plugin і plugin, опублікованих зовні.                                                           |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                         |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із semver-нижньою межею, наприклад `>=2026.3.22`.                                             |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення bundled plugin, коли конфігурація невалідна.                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням каналу лише для налаштування завантажуватися до повного plugin каналу під час запуску.                                   |

`openclaw.install.minHostVersion` застосовується під час встановлення та
завантаження реєстру маніфестів. Невалідні значення відхиляються; новіші, але валідні значення пропускають
plugin на старіших хостах.

`openclaw.install.allowInvalidConfigRecovery` навмисно має вузьке призначення. Воно
не робить довільно зламані конфігурації придатними до встановлення. Сьогодні воно лише дозволяє
потокам встановлення відновлюватися після конкретних застарілих збоїв оновлення bundled plugin, наприклад
відсутнього шляху до bundled plugin або застарілого запису `channels.<id>` для того самого
bundled plugin. Непов’язані помилки конфігурації все одно блокують встановлення і спрямовують операторів
до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це метадані пакета для крихітного модуля
перевірки:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

Використовуйте це, коли потоки налаштування, doctor або перевірки налаштованого стану потребують
недорогої перевірки auth типу так/ні до завантаження повного plugin каналу. Цільовий export має бути невеликою
функцією, яка читає лише збережений стан; не маршрутизуйте її через повний barrel
середовища виконання каналу.

`openclaw.channel.configuredState` має таку саму форму для недорогих перевірок
налаштованого стану лише через env:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

Використовуйте це, коли канал може визначити налаштований стан через env або інші невеликі
входи, не пов’язані з середовищем виконання. Якщо перевірка потребує повного розв’язання конфігурації або реального
середовища виконання каналу, залиште цю логіку в хуку plugin `config.hasConfiguredState`.

## Вимоги до JSON Schema

- **Кожен plugin має постачатися з JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема допустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми проходять валідацію під час читання/запису конфігурації, а не під час виконання.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки ідентифікатор каналу не оголошено в
  маніфесті plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **виявлювані** ідентифікатори plugin. Невідомі id є **помилками**.
- Якщо plugin встановлено, але він має зламаний або відсутній маніфест чи схему,
  валідація завершується помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнений**, конфігурація зберігається, і
  у Doctor та журналах з’являється **попередження**.

Повну схему `plugins.*` дивіться в розділі [Довідник конфігурації](/uk/gateway/configuration).

## Примітки

- Маніфест **обов’язковий для власних plugin OpenClaw**, зокрема для локальних завантажень із файлової системи.
- Середовище виконання все одно завантажує модуль plugin окремо; маніфест використовується лише для
  виявлення та валідації.
- Власні маніфести розбираються за допомогою JSON5, тому коментарі, кінцеві коми та
  ключі без лапок приймаються, якщо кінцеве значення все ще є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте додавання
  тут користувацьких ключів верхнього рівня.
- `providerAuthEnvVars` — це недорогий шлях метаданих для перевірок auth, валідації
  env-маркерів та подібних поверхонь auth provider, які не повинні запускати середовище виконання plugin
  лише для перевірки назв env.
- `providerAuthAliases` дозволяє варіантам provider повторно використовувати auth
  env vars, профілі auth, auth на основі конфігурації та варіант онбордингу API key іншого provider
  без жорсткого кодування цього зв’язку в core.
- `channelEnvVars` — це недорогий шлях метаданих для shell-env fallback, підказок
  налаштування та подібних поверхонь каналів, які не повинні запускати середовище виконання plugin
  лише для перевірки назв env.
- `providerAuthChoices` — це недорогий шлях метаданих для пікерів варіантів auth,
  розв’язання `--auth-choice`, мапування пріоритетного provider та простої реєстрації прапорців CLI
  для онбордингу до завантаження середовища виконання provider. Метадані майстра середовища виконання,
  яким потрібен код provider, дивіться в
  [Хуках середовища виконання provider](/uk/plugins/architecture#provider-runtime-hooks).
- Ексклюзивні типи plugin вибираються через `plugins.slots.*`.
  - `kind: "memory"` вибирається через `plugins.slots.memory`.
  - `kind: "context-engine"` вибирається через `plugins.slots.contextEngine`
    (за замовчуванням: вбудований `legacy`).
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо
  plugin їх не потребує.
- Якщо ваш plugin залежить від native-модулів, задокументуйте кроки збирання та всі
  вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Пов’язане

- [Створення Plugins](/uk/plugins/building-plugins) — початок роботи з plugins
- [Архітектура Plugin](/uk/plugins/architecture) — внутрішня архітектура
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник по Plugin SDK
