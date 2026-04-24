---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно постачати схему конфігурації Plugin або налагоджувати помилки валідації Plugin
summary: Вимоги до маніфесту Plugin та JSON schema (сувора валідація конфігурації)
title: маніфест Plugin
x-i18n:
    generated_at: "2026-04-24T02:14:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2edbf4056e6efb3caf367f1f60502b6d050cbd8c7b9173d1232703656e1bd3ba
    source_path: plugins/manifest.md
    workflow: 15
---

Ця сторінка призначена лише для **власного маніфесту Plugin OpenClaw**.

Для сумісних макетів bundle див. [Plugin bundles](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети bundle, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі зчитує метадані bundle, а також оголошені
кореневі каталоги skills, кореневі каталоги команд Claude, значення за замовчуванням `settings.json` у Claude bundle,
значення LSP за замовчуванням у Claude bundle та підтримувані набори хуків, коли макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен власний Plugin OpenClaw **повинен** постачатися з файлом `openclaw.plugin.json` у
**корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду plugin**. Відсутні або недійсні маніфести вважаються
помилками plugin і блокують валідацію конфігурації.

Див. повний посібник із системи plugin: [Plugins](/uk/tools/plugin).
Щодо власної моделі можливостей і поточних рекомендацій із зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує **до завантаження коду
вашого plugin**. Усе нижче має бути достатньо легким для перевірки без запуску
середовища виконання plugin.

**Використовуйте його для:**

- ідентичності plugin, валідації конфігурації та підказок для UI конфігурації
- метаданих автентифікації, онбордингу та налаштування (псевдонім, автоувімкнення, змінні середовища provider, варіанти автентифікації)
- підказок активації для поверхонь control plane
- скороченого володіння сімейством моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації, специфічних для channel, об’єднаних у поверхнях каталогу та валідації

**Не використовуйте його для:** реєстрації поведінки під час виконання, оголошення
точок входу коду або метаданих встановлення npm. Вони належать до коду вашого plugin і `package.json`.

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

## Розгорнутий приклад

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
  "providerEndpoints": [
    {
      "endpointClass": "xai-native",
      "hosts": ["api.x.ai"]
    }
  ],
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
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

| Поле                                 | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                                                  |
| ------------------------------------ | ----------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний ідентифікатор plugin. Саме цей ідентифікатор використовується в `plugins.entries.<id>`.                                                                                                                              |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                                             |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає bundled plugin як увімкнений за замовчуванням. Не вказуйте це поле або задайте будь-яке значення, відмінне від `true`, щоб plugin залишався вимкненим за замовчуванням.                                               |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі ідентифікатори, які нормалізуються до цього канонічного ідентифікатора plugin.                                                                                                                                        |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Ідентифікатори provider, які мають автоматично вмикати цей plugin, коли автентифікація, конфігурація або посилання на моделі згадують їх.                                                                                      |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип plugin, який використовується `plugins.slots.*`.                                                                                                                                                       |
| `channels`                           | Ні          | `string[]`                       | Ідентифікатори channel, якими володіє цей plugin. Використовується для виявлення та валідації конфігурації.                                                                                                                     |
| `providers`                          | Ні          | `string[]`                       | Ідентифікатори provider, якими володіє цей plugin.                                                                                                                                                                               |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейства моделей, якими володіє маніфест і які використовуються для автозавантаження plugin до запуску runtime.                                                                                            |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані host/baseUrl кінцевих точок, якими володіє маніфест, для маршрутів provider, які ядро має класифікувати до завантаження runtime provider.                                                                             |
| `cliBackends`                        | Ні          | `string[]`                       | Ідентифікатори backend висновку CLI, якими володіє цей plugin. Використовуються для автоактивації під час запуску з явних посилань у конфігурації.                                                                              |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на provider або backend CLI, чиї синтетичні хуки автентифікації, якими володіє plugin, слід перевіряти під час холодного виявлення моделей до завантаження runtime.                                                 |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API key, якими володіє bundled plugin і які представляють не секретний локальний стан, OAuth або стан облікових даних середовища.                                                                          |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, якими володіє цей plugin і які мають повертати діагностику конфігурації та CLI з урахуванням plugin до завантаження runtime.                                                                                     |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Недорогі метадані змінних середовища автентифікації provider, які OpenClaw може перевіряти без завантаження коду plugin.                                                                                                       |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Ідентифікатори provider, які мають повторно використовувати інший ідентифікатор provider для пошуку автентифікації, наприклад provider для кодування, який ділить API key і профілі автентифікації з базовим provider.     |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Недорогі метадані змінних середовища channel, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для налаштування channel або поверхонь автентифікації на основі env, які мають бачити загальні помічники запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Недорогі метадані варіантів автентифікації для засобів вибору під час онбордингу, визначення пріоритетного provider та простого підключення прапорців CLI.                                                                     |
| `activation`                         | Ні          | `object`                         | Недорогі підказки активації для завантаження, що запускається provider, командою, channel, маршрутом і можливостями. Лише метадані; фактичною поведінкою, як і раніше, володіє runtime plugin.                               |
| `setup`                              | Ні          | `object`                         | Недорогі дескриптори налаштування/онбордингу, які поверхні виявлення та налаштування можуть перевіряти без завантаження runtime plugin.                                                                                         |
| `qaRunners`                          | Ні          | `object[]`                       | Недорогі дескриптори QA runner, які використовуються спільним хостом `openclaw qa` до завантаження runtime plugin.                                                                                                              |
| `contracts`                          | Ні          | `object`                         | Статичний знімок bundled можливостей для зовнішніх хуків автентифікації, мовлення, транскрибування в реальному часі, голосу в реальному часі, розуміння медіа, генерації зображень, генерації музики, генерації відео, web-fetch, web search і володіння інструментами. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Недорогі значення за замовчуванням для розуміння медіа для ідентифікаторів provider, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                      |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації channel, якими володіє маніфест і які об’єднуються в поверхнях виявлення та валідації до завантаження runtime.                                                                                           |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skill для завантаження, відносно кореня plugin.                                                                                                                                                                         |
| `name`                               | Ні          | `string`                         | Людинозрозуміла назва plugin.                                                                                                                                                                                                    |
| `description`                        | Ні          | `string`                         | Короткий підсумок, який показується в поверхнях plugin.                                                                                                                                                                          |
| `version`                            | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                                      |
| `uiHints`                            | Ні          | `Record<string, object>`         | Мітки UI, placeholders і підказки щодо чутливості для полів конфігурації.                                                                                                                                                       |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або автентифікації.
OpenClaw зчитує це до завантаження runtime provider.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Ідентифікатор provider, до якого належить цей варіант.                                                    |
| `method`              | Так         | `string`                                        | Ідентифікатор методу автентифікації, до якого слід диспетчеризувати.                                      |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор варіанта автентифікації, який використовується в онбордингу та CLI-потоках.     |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо не вказано, OpenClaw використовує `choiceId`.                                 |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для засобу вибору.                                                              |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних засобах вибору, керованих помічником.                   |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант із засобів вибору помічника, але все ще дозволяє ручний вибір через CLI.                |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори варіантів, які мають перенаправляти користувачів до цього варіанта-заміни.      |
| `groupId`             | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для групування пов’язаних варіантів.                                   |
| `groupLabel`          | Ні          | `string`                                        | Мітка цієї групи для користувача.                                                                         |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                      |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ опції для простих потоків автентифікації з одним прапорцем.                               |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                     |
| `cliOption`           | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                            |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                                |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з’являтися цей варіант. Якщо не вказано, використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє іменем runtime-команди, яку користувачі
можуть помилково вказати в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
використовує ці метадані для діагностики без імпорту коду runtime plugin.

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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                             |
| ------------ | ----------- | ----------------- | --------------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Ім’я команди, яке належить цьому plugin.                                    |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як команду чату зі слешем, а не як кореневу команду CLI. |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід запропонувати для операцій CLI, якщо вона існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може недорого оголосити, які події control plane
мають активувати його пізніше.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або кілька transport runner під спільним
коренем `openclaw qa`. Зберігайте ці метадані недорогими та статичними; runtime
plugin, як і раніше, володіє фактичною реєстрацією CLI через легковагову
поверхню `runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| Поле          | Обов’язкове | Тип      | Що воно означає                                                        |
| ------------- | ----------- | -------- | ---------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.          |
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна команда-заглушка. |

Цей блок є лише метаданими. Він не реєструє поведінку під час виконання й не
замінює `register(...)`, `setupEntry` або інші точки входу runtime/plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням plugin, тому
відсутність метаданих активації зазвичай лише впливає на продуктивність; вона не повинна
змінювати коректність, поки ще існують резервні механізми володіння маніфестом старого типу.

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                        |
| ---------------- | ----------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `onProviders`    | Ні          | `string[]`                                           | Ідентифікатори provider, які мають активувати цей plugin при запиті.   |
| `onCommands`     | Ні          | `string[]`                                           | Ідентифікатори команд, які мають активувати цей plugin.                |
| `onChannels`     | Ні          | `string[]`                                           | Ідентифікатори channel, які мають активувати цей plugin.               |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають активувати цей plugin.                       |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки можливостей, які використовуються в плануванні активації control plane. |

Поточні активні споживачі:

- планування CLI, що запускається командою, використовує резервний механізм
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування налаштування/channel, що запускається channel, використовує резервний механізм старого
  володіння `channels[]`, коли явні метадані активації channel відсутні
- планування налаштування/runtime, що запускається provider, використовує резервний механізм старого
  володіння `providers[]` і верхньорівневого `cliBackends[]`, коли явні метадані
  активації provider відсутні

## Довідник `setup`

Використовуйте `setup`, коли поверхням налаштування та онбордингу потрібні недорогі метадані plugin
до завантаження runtime.

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

Верхньорівневе `cliBackends` залишається чинним і надалі описує backend висновку CLI.
`setup.cliBackends` — це поверхня дескрипторів, специфічна для налаштування, для
потоків control plane/налаштування, які мають залишатися лише метаданими.

Якщо вказано, `setup.providers` і `setup.cliBackends` є пріоритетною
поверхнею пошуку для виявлення налаштування за принципом descriptor-first. Якщо дескриптор лише
звужує candidate plugin, а налаштуванню все ще потрібні багатші runtime-хуки часу налаштування,
установіть `requiresRuntime: true` і залиште `setup-api` як
резервний шлях виконання.

Оскільки пошук налаштування може виконувати код `setup-api`, яким володіє plugin,
нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними
серед виявлених plugin. Неоднозначне володіння завершується закритою відмовою замість вибору
переможця за порядком виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                       |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | Ідентифікатор provider, що відкривається під час налаштування або онбордингу. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Ідентифікатори методів налаштування/автентифікації, які цей provider підтримує без завантаження повного runtime. |
| `envVars`     | Ні          | `string[]` | Змінні середовища, які загальні поверхні налаштування/статусу можуть перевіряти до завантаження runtime plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                         |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори налаштування provider, що відкриваються під час налаштування та онбордингу.                |
| `cliBackends`      | Ні          | `string[]` | Ідентифікатори backend часу налаштування, які використовуються для пошуку налаштування за принципом descriptor-first. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Ідентифікатори міграцій конфігурації, якими володіє поверхня `setup` цього plugin.                      |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує налаштування виконання `setup-api` після пошуку за дескриптором.                            |

## Довідник `uiHints`

`uiHints` — це мапа від імен полів конфігурації до невеликих підказок рендерингу.

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

Кожна підказка поля може містити:

| Поле          | Тип        | Що воно означає                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Мітка поля для користувача.             |
| `help`        | `string`   | Короткий допоміжний текст.              |
| `tags`        | `string[]` | Необов’язкові теги UI.                  |
| `advanced`    | `boolean`  | Позначає поле як розширене.             |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.  |
| `placeholder` | `string`   | Текст placeholder для полів форми.      |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
зчитувати без імпорту runtime plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
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

| Поле                             | Тип        | Що воно означає                                                        |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ідентифікатори вбудованого runtime, для яких bundled plugin може реєструвати factory. |
| `externalAuthProviders`          | `string[]` | Ідентифікатори provider, чиїм хуком профілю зовнішньої автентифікації володіє цей plugin. |
| `speechProviders`                | `string[]` | Ідентифікатори provider мовлення, якими володіє цей plugin.            |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори provider транскрибування в реальному часі, якими володіє цей plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори provider голосу в реальному часі, якими володіє цей plugin. |
| `memoryEmbeddingProviders`       | `string[]` | Ідентифікатори provider embedding для пам’яті, якими володіє цей plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори provider розуміння медіа, якими володіє цей plugin.     |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори provider генерації зображень, якими володіє цей plugin. |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори provider генерації відео, якими володіє цей plugin.     |
| `webFetchProviders`              | `string[]` | Ідентифікатори provider web-fetch, якими володіє цей plugin.           |
| `webSearchProviders`             | `string[]` | Ідентифікатори provider web search, якими володіє цей plugin.          |
| `tools`                          | `string[]` | Назви інструментів агента, якими володіє цей plugin, для bundled перевірок контрактів. |

Plugin provider, які реалізують `resolveExternalAuthProfiles`, повинні оголошувати
`contracts.externalAuthProviders`. Plugin без цього оголошення все ще працюють
через застарілий резервний механізм сумісності, але цей механізм повільніший і
буде видалений після завершення вікна міграції.

Bundled provider embedding для пам’яті повинні оголошувати
`contracts.memoryEmbeddingProviders` для кожного ідентифікатора адаптера, який вони відкривають, включно з
вбудованими адаптерами, такими як `local`. Окремі шляхи CLI використовують цей контракт
маніфесту, щоб завантажувати лише plugin-власник до того, як повний runtime Gateway
зареєструє provider.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли provider розуміння медіа має
моделі за замовчуванням, пріоритет резервного авто-автентифікування або вбудовану підтримку документів,
які потрібні загальним помічникам ядра до завантаження runtime. Ключі також мають бути оголошені в
`contracts.mediaUnderstandingProviders`.

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

Кожен запис provider може містити:

| Поле                   | Тип                                 | Що воно означає                                                           |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Можливості медіа, які відкриває цей provider.                             |
| `defaultModels`        | `Record<string, string>`            | Значення за замовчуванням для відповідності можливість-модель, які використовуються, коли конфігурація не задає модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору provider на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Вбудовані входи документів, які підтримує provider.                       |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли plugin channel потребує недорогих метаданих конфігурації до
завантаження runtime.

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

Кожен запис channel може містити:

| Поле          | Тип                      | Що воно означає                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису конфігурації channel. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/placeholders/підказки чутливості для цього розділу конфігурації channel. |
| `label`       | `string`                 | Мітка channel, яка об’єднується в поверхнях вибору та перевірки, коли метадані runtime ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь перевірки та каталогу.                                      |
| `preferOver`  | `string[]`               | Ідентифікатори застарілих plugin або plugin з нижчим пріоритетом, які цей channel має випереджати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш plugin provider із
скорочених ідентифікаторів моделей на кшталт `gpt-5.5` або `claude-sonnet-4.6` до завантаження
runtime plugin.

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
- якщо збігаються один небандлований plugin і один bundled plugin, перемагає небандлований
  plugin
- решта неоднозначностей ігноруються, доки користувач або конфігурація не вкаже provider

Поля:

| Поле            | Тип        | Що воно означає                                                                |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Префікси, які зіставляються через `startsWith` зі скороченими ідентифікаторами моделей. |
| `modelPatterns` | `string[]` | Джерела regex, які зіставляються зі скороченими ідентифікаторами моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня застаріли. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` під `contracts`; звичайне
завантаження маніфесту більше не розглядає ці поля верхнього рівня як
власність можливостей.

## Маніфест проти package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого його використовувати                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів автентифікації та підказки UI, які мають існувати до запуску коду plugin |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для точок входу, обмежень встановлення, налаштування або метаданих каталогу |

Якщо ви не впевнені, де має бути певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw має знати це до завантаження коду plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, вхідних файлів або поведінки встановлення npm, помістіть це в `package.json`

### Поля `package.json`, які впливають на виявлення

Деякі метадані plugin до запуску runtime навмисно зберігаються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує точки входу власного Plugin. Має залишатися в межах каталогу пакета plugin.                                                                                                |
| `openclaw.runtimeExtensions`                                      | Оголошує точки входу built JavaScript runtime для встановлених пакетів. Має залишатися в межах каталогу пакета plugin.                                                             |
| `openclaw.setupEntry`                                             | Легковагова точка входу лише для налаштування, яка використовується під час онбордингу, відкладеного запуску channel та виявлення стану channel/SecretRef у режимі лише читання. Має залишатися в межах каталогу пакета plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує built JavaScript точку входу налаштування для встановлених пакетів. Має залишатися в межах каталогу пакета plugin.                                                        |
| `openclaw.channel`                                                | Недорогі метадані каталогу channel, як-от мітки, шляхи до документації, псевдоніми та текст для вибору.                                                                             |
| `openclaw.channel.configuredState`                                | Легковагові метадані перевірки налаштованого стану, які можуть відповісти на запитання «чи вже існує налаштування лише через env?» без завантаження повного runtime channel.      |
| `openclaw.channel.persistedAuthState`                             | Легковагові метадані перевірки збереженого стану автентифікації, які можуть відповісти на запитання «чи є вже щось авторизоване?» без завантаження повного runtime channel.        |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для bundled plugin та plugin, опублікованих зовні.                                                                                                  |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw з використанням нижньої межі semver, наприклад `>=2026.3.22`.                                                                        |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення й оновлення перевіряють отриманий артефакт за ним.                                               |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення bundled plugin, коли конфігурація недійсна.                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для налаштування завантажуватися до повного plugin channel під час запуску.                                                                         |

Метадані маніфесту визначають, які варіанти provider/channel/налаштування з’являються в
онбордингу до завантаження runtime. `package.json#openclaw.install` повідомляє
онбордингу, як отримати або ввімкнути цей plugin, коли користувач вибирає один із цих
варіантів. Не переносіть підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та завантаження
реєстру маніфестів. Недійсні значення відхиляються; новіші, але коректні значення
пропускають plugin на старіших хостах.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Поєднуйте це з
`expectedIntegrity`, якщо хочете, щоб потоки оновлення завершувалися закритою відмовою, коли отриманий
npm-артефакт більше не відповідає закріпленому релізу. Інтерактивний онбординг
пропонує довірені npm-специфікації реєстру, зокрема прості назви пакетів і dist-tags.
Коли присутній `expectedIntegrity`, потоки встановлення/оновлення застосовують його; коли його
пропущено, розв’язання реєстру записується без закріплення цілісності.

Plugin channel мають надавати `openclaw.setupEntry`, коли для статусу, списку channel
або сканування SecretRef потрібно визначати налаштовані облікові записи без завантаження повного
runtime. Точка входу налаштування має відкривати метадані channel разом із безпечними для setup
адаптерами конфігурації, статусу та секретів; залишайте мережеві клієнти, слухачі Gateway і
transport runtime у головній точці входу extension.

Поля точок входу runtime не перевизначають перевірки меж пакета для полів
вихідних точок входу. Наприклад, `openclaw.runtimeExtensions` не може зробити
завантажуваним шлях `openclaw.extensions`, що виходить за межі пакета.

`openclaw.install.allowInvalidConfigRecovery` навмисно є вузьким. Воно
не робить довільні зламані конфігурації придатними до встановлення. Наразі воно лише дозволяє потокам встановлення
відновлюватися після певних застарілих збоїв оновлення bundled plugin, наприклад
відсутнього шляху до bundled plugin або застарілого запису `channels.<id>` для того самого
bundled plugin. Непов’язані помилки конфігурації, як і раніше, блокують встановлення та спрямовують операторів
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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна недорога перевірка
автентифікації типу так/ні до завантаження повного plugin channel. Цільовий експорт має бути невеликою
функцією, яка лише читає збережений стан; не спрямовуйте її через повний
barrel runtime channel.

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

Використовуйте це, коли channel може визначити налаштований стан з env або інших малих
невиконуваних входів. Якщо перевірка потребує повного розв’язання конфігурації або реального
runtime channel, залиште цю логіку в хуку plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати ідентифікаторів plugin)

OpenClaw виявляє plugin із кількох коренів (bundled, глобальне встановлення, workspace, явно вибрані в конфігурації шляхи). Якщо два знайдені plugin мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет від найвищого до найнижчого:

1. **Вибраний конфігурацією** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Bundled** — plugin, які постачаються разом з OpenClaw
3. **Глобальне встановлення** — plugin, встановлені в глобальний корінь plugin OpenClaw
4. **Workspace** — plugin, виявлені відносно поточного workspace

Наслідки:

- Форк або застаріла копія bundled plugin, що лежить у workspace, не перекриє bundled збірку.
- Щоб справді перевизначити bundled plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтеся на виявлення workspace.
- Відкидання дублікатів логуються, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен plugin повинен постачатися з JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема допустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми проходять валідацію під час читання/запису конфігурації, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки ідентифікатор channel не оголошено в
  маніфесті plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **виявлювані** ідентифікатори plugin. Невідомі ідентифікатори є **помилками**.
- Якщо plugin встановлено, але він має зламаний або відсутній маніфест чи схему,
  валідація не проходить, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнений**, конфігурація зберігається, і
  у Doctor + логах відображається **попередження**.

Див. [Довідник із конфігурації](/uk/gateway/configuration) для повної схеми `plugins.*`.

## Примітки

- Маніфест **обов’язковий для власних Plugin OpenClaw**, зокрема для локальних завантажень із файлової системи. Runtime усе одно завантажує модуль plugin окремо; маніфест використовується лише для виявлення + валідації.
- Власні маніфести розбираються за допомогою JSON5, тому коментарі, завершальні коми та не взяті в лапки ключі дозволені, якщо кінцеве значення все ще є об’єктом.
- Завантажувач маніфесту читає лише документовані поля маніфесту. Уникайте користувацьких ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо plugin їх не потребує.
- Ексклюзивні типи plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Метадані змінних середовища (`providerAuthEnvVars`, `channelEnvVars`) є лише декларативними. Статус, аудит, валідація доставки Cron та інші поверхні лише для читання все одно застосовують політику довіри plugin та ефективної активації, перш ніж вважати змінну середовища налаштованою.
- Щодо метаданих runtime wizard, які потребують коду provider, див. [Хуки runtime provider](/uk/plugins/architecture#provider-runtime-hooks).
- Якщо ваш plugin залежить від native module, задокументуйте кроки збірки та всі вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з plugin.
  </Card>
  <Card title="Архітектура plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник Plugin SDK та імпортів підшляхів.
  </Card>
</CardGroup>
