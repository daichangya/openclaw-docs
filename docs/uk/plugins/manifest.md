---
read_when:
    - Ви створюєте Plugin OpenClaw
    - Вам потрібно постачати schema конфігурації plugin або налагодити помилки валідації plugin
summary: Маніфест Plugin + вимоги до JSON schema (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-23T19:25:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4dd7c7e91637ff93ea60ee5d8069a9263382749435ca22a804fece05fc5f94ac
    source_path: plugins/manifest.md
    workflow: 15
---

# Маніфест Plugin (`openclaw.plugin.json`)

Ця сторінка стосується лише **рідного маніфесту Plugin OpenClaw**.

Сумісні макети bundle див. у [Plugin bundles](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- bundle Codex: `.codex-plugin/plugin.json`
- bundle Claude: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- bundle Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети bundle, але вони не проходять валідацію
за schema `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw зараз читає метадані bundle разом із оголошеними
коренями skill, коренями команд Claude, значеннями за замовчуванням `settings.json` bundle Claude,
значеннями за замовчуванням LSP bundle Claude та підтримуваними наборами hook, коли макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен рідний Plugin OpenClaw **повинен** постачатися з файлом `openclaw.plugin.json` у
**корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду plugin**. Відсутні або невалідні маніфести вважаються
помилками plugin і блокують валідацію конфігурації.

Див. повний посібник із системи plugin: [Plugins](/uk/tools/plugin).
Щодо рідної моделі можливостей і поточних рекомендацій із зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **до завантаження коду
вашого plugin**. Усе нижче має бути достатньо легким для перевірки без запуску
середовища виконання plugin.

**Використовуйте його для:**

- ідентичності plugin, валідації конфігурації та підказок інтерфейсу конфігурації
- метаданих автентифікації, онбордингу та налаштування (псевдонім, автоувімкнення, env vars провайдера, варіанти автентифікації)
- підказок активації для поверхонь control plane
- володіння скороченими model family
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які спільний хост `openclaw qa` може перевіряти
- метаданих конфігурації, специфічних для каналу, які об’єднуються в поверхні каталогу та валідації

**Не використовуйте його для:** реєстрації поведінки під час виконання, оголошення
точок входу коду або метаданих встановлення npm. Це належить вашому коду plugin і `package.json`.

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
  "description": "Plugin провайдера OpenRouter",
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
      "choiceLabel": "API key OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "API key OpenRouter",
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

| Поле                                | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                                                   |
| ----------------------------------- | ----------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Так         | `string`                         | Канонічний id plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                                                    |
| `configSchema`                      | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                                            |
| `enabledByDefault`                  | Ні          | `true`                           | Позначає вбудований plugin як увімкнений за замовчуванням. Пропустіть це поле або задайте будь-яке значення, відмінне від `true`, щоб plugin залишався вимкненим за замовчуванням.                                            |
| `legacyPluginIds`                   | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id plugin.                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders` | Ні          | `string[]`                       | Id провайдерів, які мають автоматично вмикати цей plugin, коли автентифікація, конфігурація або model refs посилаються на них.                                                                                                |
| `kind`                              | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип plugin, який використовується `plugins.slots.*`.                                                                                                                                                     |
| `channels`                          | Ні          | `string[]`                       | Id каналів, якими володіє цей plugin. Використовуються для виявлення та валідації конфігурації.                                                                                                                                |
| `providers`                         | Ні          | `string[]`                       | Id провайдерів, якими володіє цей plugin.                                                                                                                                                                                       |
| `modelSupport`                      | Ні          | `object`                         | Метадані скорочених model family, що належать маніфесту та використовуються для автозавантаження plugin до старту середовища виконання.                                                                                       |
| `providerEndpoints`                 | Ні          | `object[]`                       | Метадані хостів/baseUrl ендпоінтів, що належать маніфесту, для маршрутів провайдерів, які ядро має класифікувати до завантаження середовища виконання провайдера.                                                             |
| `cliBackends`                       | Ні          | `string[]`                       | Id бекендів CLI inference, якими володіє цей plugin. Використовуються для автоактивації під час запуску на основі явних посилань у конфігурації.                                                                              |
| `syntheticAuthRefs`                 | Ні          | `string[]`                       | Посилання на провайдери або бекенди CLI, для яких під час холодного виявлення моделей до завантаження середовища виконання слід перевіряти синтетичний auth hook, що належить plugin.                                        |
| `nonSecretAuthMarkers`              | Ні          | `string[]`                       | Значення-заповнювачі API key, що належать вбудованому plugin і представляють не секретний локальний стан, OAuth або ambient credentials.                                                                                       |
| `commandAliases`                    | Ні          | `object[]`                       | Назви команд, якими володіє цей plugin і які мають формувати діагностику конфігурації та CLI з урахуванням plugin до завантаження середовища виконання.                                                                       |
| `providerAuthEnvVars`               | Ні          | `Record<string, string[]>`       | Легкі метадані env автентифікації провайдера, які OpenClaw може перевіряти без завантаження коду plugin.                                                                                                                      |
| `providerAuthAliases`               | Ні          | `Record<string, string>`         | Id провайдерів, які мають повторно використовувати інший id провайдера для пошуку автентифікації, наприклад провайдер кодування, який спільно використовує API key базового провайдера та профілі автентифікації.          |
| `channelEnvVars`                    | Ні          | `Record<string, string[]>`       | Легкі метадані env каналу, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для налаштування каналу через env або для поверхонь автентифікації, які мають бачити універсальні допоміжні засоби запуску/конфігурації. |
| `providerAuthChoices`               | Ні          | `object[]`                       | Легкі метадані варіантів автентифікації для picker онбордингу, визначення бажаного провайдера та простого зв’язування прапорців CLI.                                                                                          |
| `activation`                        | Ні          | `object`                         | Легкі підказки активації для завантаження, що запускається провайдером, командою, каналом, маршрутом і можливостями. Лише метадані; фактична поведінка все ще належить середовищу виконання plugin.                         |
| `setup`                             | Ні          | `object`                         | Легкі дескриптори налаштування/онбордингу, які поверхні виявлення та налаштування можуть перевіряти без завантаження середовища виконання plugin.                                                                             |
| `qaRunners`                         | Ні          | `object[]`                       | Легкі дескриптори QA runner, які використовуються спільним хостом `openclaw qa` до завантаження середовища виконання plugin.                                                                                                  |
| `contracts`                         | Ні          | `object`                         | Статичний знімок вбудованих можливостей для зовнішніх auth hooks, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння інструментами. |
| `mediaUnderstandingProviderMetadata` | Ні         | `Record<string, object>`         | Легкі значення media-understanding за замовчуванням для id провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                 |
| `channelConfigs`                    | Ні          | `Record<string, object>`         | Метадані конфігурації каналу, що належать маніфесту та об’єднуються в поверхні виявлення та валідації до завантаження середовища виконання.                                                                                   |
| `skills`                            | Ні          | `string[]`                       | Каталоги Skills для завантаження відносно кореня plugin.                                                                                                                                                                        |
| `name`                              | Ні          | `string`                         | Людинозрозуміла назва plugin.                                                                                                                                                                                                   |
| `description`                       | Ні          | `string`                         | Короткий опис, який показується в поверхнях plugin.                                                                                                                                                                             |
| `version`                           | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                                     |
| `uiHints`                           | Ні          | `Record<string, object>`         | Мітки UI, placeholders і підказки щодо чутливості для полів конфігурації.                                                                                                                                                      |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або автентифікації.
OpenClaw читає це до завантаження середовища виконання провайдера.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                   |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Id провайдера, до якого належить цей варіант.                                                     |
| `method`              | Так         | `string`                                        | Id методу автентифікації, до якого слід диспетчеризувати.                                         |
| `choiceId`            | Так         | `string`                                        | Стабільний id варіанта автентифікації, який використовується онбордингом і CLI-потоками.         |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо не вказано, OpenClaw повертається до `choiceId`.                      |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для picker.                                                             |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних picker, керованих асистентом.                    |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант у picker асистента, але все ще дозволяє ручний вибір через CLI.                  |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі id варіантів, які мають перенаправляти користувачів до цього варіанта-замінника.       |
| `groupId`             | Ні          | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                      |
| `groupLabel`          | Ні          | `string`                                        | Мітка цієї групи для користувача.                                                                  |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                               |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків автентифікації з одним прапорцем.                   |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                             |
| `cliOption`           | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                         |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з’являтися цей варіант. Якщо не вказано, використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли Plugin володіє назвою runtime-команди, яку користувачі можуть
помилково помістити в `plugins.allow` або спробувати запустити як кореневу CLI-команду. OpenClaw
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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                            |
| ------------ | ----------- | ----------------- | -------------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, яка належить цьому plugin.                                  |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не кореневу CLI-команду.       |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева CLI-команда, яку слід пропонувати для CLI-операцій, якщо така існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може дешево оголосити, які події control plane
мають активувати його пізніше.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або кілька транспортних runner під
спільним коренем `openclaw qa`. Зберігайте ці метадані легкими й статичними; середовище виконання plugin
усе одно володіє фактичною реєстрацією CLI через полегшену
поверхню `runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Запустити живу QA-смугу Matrix на базі Docker проти одноразового homeserver"
    }
  ]
}
```

| Поле          | Обов’язкове | Тип      | Що воно означає                                                   |
| ------------- | ----------- | -------- | ----------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.     |
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

Цей блок — лише метадані. Він не реєструє поведінку runtime і не
замінює `register(...)`, `setupEntry` або інші точки входу runtime/plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням plugin, тож
відсутність метаданих activation зазвичай лише впливає на продуктивність;
це не повинно змінювати коректність, доки все ще існують застарілі резервні механізми володіння маніфестом.

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

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                   |
| ---------------- | ----------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `onProviders`    | Ні          | `string[]`                                           | Id провайдерів, які мають активувати цей plugin за запитом.       |
| `onCommands`     | Ні          | `string[]`                                           | Id команд, які мають активувати цей plugin.                       |
| `onChannels`     | Ні          | `string[]`                                           | Id каналів, які мають активувати цей plugin.                      |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають активувати цей plugin.                  |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки щодо можливостей, які використовуються під час планування активації control plane. |

Поточні активні споживачі:

- планування CLI, що запускається командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування налаштування/каналу, що запускається каналом, повертається до застарілого
  володіння `channels[]`, коли явні метадані активації каналу відсутні
- планування налаштування/runtime, що запускається провайдером, повертається до застарілого
  володіння `providers[]` і `cliBackends[]` верхнього рівня, коли явні метадані
  активації провайдера відсутні

## Довідник `setup`

Використовуйте `setup`, коли поверхням налаштування й онбордингу потрібні легкі метадані plugin,
що належать plugin, до завантаження runtime.

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

`cliBackends` верхнього рівня залишається валідним і далі описує бекенди CLI inference.
`setup.cliBackends` — це поверхня дескрипторів, специфічна для налаштування,
для потоків control plane/setup, які мають залишатися лише метаданими.

Коли вони присутні, `setup.providers` і `setup.cliBackends` є бажаною
поверхнею пошуку з підходом «спочатку дескриптор» для виявлення налаштування. Якщо дескриптор лише
звужує коло кандидатів plugin, а налаштуванню все ще потрібні багатші runtime hooks часу налаштування,
задайте `requiresRuntime: true` і залиште `setup-api` як
резервний шлях виконання.

Оскільки пошук налаштування може виконувати код `setup-api`, що належить plugin,
нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед
виявлених plugins. Неоднозначне володіння завершується закрито, а не вибирає
переможця відповідно до порядку виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                         |
| ------------- | ----------- | ---------- | --------------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | Id провайдера, що надається під час налаштування або онбордингу. Підтримуйте глобальну унікальність нормалізованих id. |
| `authMethods` | Ні          | `string[]` | Id методів налаштування/автентифікації, які цей провайдер підтримує без завантаження повного runtime. |
| `envVars`     | Ні          | `string[]` | Env vars, які загальні поверхні налаштування/статусу можуть перевіряти до завантаження runtime plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                       |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори налаштування провайдерів, що надаються під час налаштування й онбордингу.                |
| `cliBackends`      | Ні          | `string[]` | Id бекендів часу налаштування, які використовуються для пошуку налаштування за принципом «спочатку дескриптор». Підтримуйте глобальну унікальність нормалізованих id. |
| `configMigrations` | Ні          | `string[]` | Id міграцій конфігурації, що належать поверхні налаштування цього plugin.                            |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує налаштування виконання `setup-api` після пошуку дескриптора.                             |

## Довідник `uiHints`

`uiHints` — це мапа імен полів конфігурації на невеликі підказки рендерингу.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Використовується для запитів OpenRouter",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

Кожна підказка поля може містити:

| Поле          | Тип        | Що воно означає                           |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Мітка поля для користувача.              |
| `help`        | `string`   | Короткий допоміжний текст.               |
| `tags`        | `string[]` | Необов’язкові теги UI.                   |
| `advanced`    | `boolean`  | Позначає поле як розширене.              |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.   |
| `placeholder` | `string`   | Текст placeholder для полів форми.       |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
читати без імпорту runtime plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
    "externalAuthProviders": ["acme-ai"],
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

Кожен список необов’язковий:

| Поле                             | Тип        | Що воно означає                                                      |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Id вбудованих runtime, для яких вбудований plugin може реєструвати factory. |
| `externalAuthProviders`          | `string[]` | Id провайдерів, чий hook зовнішнього auth profile належить цьому plugin. |
| `speechProviders`                | `string[]` | Id speech-провайдерів, якими володіє цей plugin.                     |
| `realtimeTranscriptionProviders` | `string[]` | Id провайдерів realtime-transcription, якими володіє цей plugin.     |
| `realtimeVoiceProviders`         | `string[]` | Id провайдерів realtime-voice, якими володіє цей plugin.             |
| `mediaUnderstandingProviders`    | `string[]` | Id провайдерів media-understanding, якими володіє цей plugin.        |
| `imageGenerationProviders`       | `string[]` | Id провайдерів image-generation, якими володіє цей plugin.           |
| `videoGenerationProviders`       | `string[]` | Id провайдерів video-generation, якими володіє цей plugin.           |
| `webFetchProviders`              | `string[]` | Id провайдерів web-fetch, якими володіє цей plugin.                  |
| `webSearchProviders`             | `string[]` | Id провайдерів web search, якими володіє цей plugin.                 |
| `tools`                          | `string[]` | Назви інструментів агента, якими володіє цей plugin для перевірок вбудованих контрактів. |

Plugins провайдерів, які реалізують `resolveExternalAuthProfiles`, мають оголошувати
`contracts.externalAuthProviders`. Plugins без цього оголошення все ще працюють
через застарілий резервний механізм сумісності, але цей механізм повільніший і
буде вилучений після завершення вікна міграції.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли провайдер media-understanding має
моделі за замовчуванням, пріоритет резервного auto-auth або нативну підтримку документів,
які потрібні універсальним допоміжним засобам ядра до завантаження runtime. Ключі також мають бути оголошені в
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

Кожен запис провайдера може містити:

| Поле                   | Тип                                 | Що воно означає                                                               |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей провайдер.                                     |
| `defaultModels`        | `Record<string, string>`            | Значення model за замовчуванням для можливостей, які використовуються, коли конфігурація не задає модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору провайдера на основі credentials. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні document inputs, які підтримує провайдер.                             |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли channel plugin потребує легких метаданих конфігурації до
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
          "label": "URL homeserver",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "З’єднання з homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Кожен запис каналу може містити:

| Поле          | Тип                      | Що воно означає                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису конфігурації каналу. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/placeholders/підказки чутливості для цього розділу конфігурації каналу. |
| `label`       | `string`                 | Мітка каналу, що об’єднується в поверхнях picker і inspect, коли метадані runtime ще не готові. |
| `description` | `string`                 | Короткий опис каналу для поверхонь inspect і catalog.                                          |
| `preferOver`  | `string[]`               | Id застарілих plugins або plugins з нижчим пріоритетом, які цей канал має випереджати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш provider plugin з
скорочених id моделей на кшталт `gpt-5.5` або `claude-sonnet-4.6` до завантаження runtime plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий пріоритет:

- явні посилання `provider/model` використовують метадані маніфесту `providers`, яким належить володіння
- `modelPatterns` мають перевагу над `modelPrefixes`
- якщо збігаються один невбудований plugin і один вбудований plugin, перемагає невбудований
  plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не задасть провайдера

Поля:

| Поле            | Тип        | Що воно означає                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, які зіставляються через `startsWith` зі скороченими id моделей.       |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими id моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня більше не рекомендовані. Використовуйте `openclaw doctor --fix`, щоб
перенести `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` до `contracts`; звичайне
завантаження маніфесту більше не розглядає ці поля верхнього рівня як
володіння можливостями.

## Маніфест проти package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів автентифікації та підказки UI, які мають існувати до запуску коду plugin |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, який використовується для точок входу, обмежень встановлення, налаштування або метаданих каталогу |

Якщо ви не впевнені, куди має належати певний фрагмент метаданих, користуйтеся таким правилом:

- якщо OpenClaw має знати це до завантаження коду plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів точок входу або поведінки встановлення npm, помістіть це в `package.json`

### Поля package.json, що впливають на виявлення

Деякі метадані plugin до запуску runtime навмисно зберігаються в `package.json` у
блоці `openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                       |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує точки входу рідного plugin. Має залишатися в межах каталогу пакета plugin.                                                                                                  |
| `openclaw.runtimeExtensions`                                      | Оголошує точки входу built JavaScript runtime для встановлених пакетів. Має залишатися в межах каталогу пакета plugin.                                                               |
| `openclaw.setupEntry`                                             | Полегшена точка входу лише для налаштування, що використовується під час онбордингу, відкладеного запуску каналу та read-only виявлення статусу каналу/SecretRef. Має залишатися в межах каталогу пакета plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує built JavaScript точку входу налаштування для встановлених пакетів. Має залишатися в межах каталогу пакета plugin.                                                          |
| `openclaw.channel`                                                | Легкі метадані каталогу каналів, як-от мітки, шляхи до документації, псевдоніми та текст для вибору.                                                                                 |
| `openclaw.channel.configuredState`                                | Легкі метадані перевірки configured state, які можуть відповісти на запитання «чи вже існує налаштування лише через env?» без завантаження повного runtime каналу.                  |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевірки persisted auth, які можуть відповісти на запитання «чи вже десь виконано вхід?» без завантаження повного runtime каналу.                                   |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для вбудованих і зовнішньо опублікованих plugins.                                                                                                    |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw з використанням нижньої межі semver, наприклад `>=2026.3.22`.                                                                         |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення й оновлення звіряють із ним отриманий артефакт.                                                   |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення перевстановлення вбудованого plugin, коли конфігурація невалідна.                                                                                  |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням каналу лише для налаштування завантажуватися до повного channel plugin під час запуску.                                                                           |

Метадані маніфесту визначають, які варіанти провайдера/каналу/налаштування з’являються в
онбордингу до завантаження runtime. `package.json#openclaw.install` повідомляє
онбордингу, як отримати або увімкнути цей plugin, коли користувач вибирає один із цих
варіантів. Не переносіть підказки встановлення до `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та
завантаження реєстру маніфестів. Невалідні значення відхиляються; новіші, але валідні значення
пропускають plugin на старіших хостах.

Точне закріплення версії npm уже зберігається в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Поєднуйте це з
`expectedIntegrity`, коли хочете, щоб потоки оновлення завершувалися закрито, якщо отриманий
артефакт npm більше не відповідає закріпленому релізу. Інтерактивний онбординг
пропонує npm specs довіреного реєстру, зокрема прості назви пакетів і dist-tags.
Коли присутній `expectedIntegrity`, потоки встановлення/оновлення застосовують його; коли його
пропущено, резолюція реєстру записується без pin цілісності.

Channel plugins мають надавати `openclaw.setupEntry`, коли статус, список каналів
або сканування SecretRef повинні визначати налаштовані облікові записи без завантаження повного
runtime. Точка входу налаштування має надавати метадані каналу разом із безпечними для налаштування адаптерами конфігурації,
статусу та секретів; мережеві клієнти, слухачі gateway і transport runtime слід залишати в основній точці входу extension.

Поля точок входу runtime не перевизначають перевірки меж пакета для
полів точок входу вихідного коду. Наприклад, `openclaw.runtimeExtensions` не може зробити
завантажуваним шлях `openclaw.extensions`, що виходить за межі.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він
не робить довільні зламані конфігурації придатними до встановлення. Наразі він дозволяє лише
потокам встановлення відновлюватися після конкретних застарілих збоїв оновлення вбудованого plugin, наприклад
відсутнього шляху вбудованого plugin або застарілого запису `channels.<id>` для того самого
вбудованого plugin. Не пов’язані помилки конфігурації все одно блокують встановлення й скеровують операторів
до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це метадані пакета для маленького модуля-перевірки:

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

Використовуйте це, коли потокам налаштування, doctor або configured-state потрібна дешева
перевірка auth типу так/ні до завантаження повного channel plugin. Цільовий export має бути невеликою
функцією, яка читає лише збережений стан; не маршрутизуйте її через повний barrel runtime каналу.

`openclaw.channel.configuredState` дотримується тієї самої форми для дешевих
перевірок configured state лише через env:

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

Використовуйте це, коли канал може визначити configured state з env або інших маленьких
нерuntime-входів. Якщо перевірка потребує повної резолюції конфігурації або реального
runtime каналу, натомість тримайте цю логіку в hook plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати id plugin)

OpenClaw виявляє plugins з кількох коренів (вбудовані, глобальне встановлення, робочий простір, шляхи, явно вибрані конфігурацією). Якщо два виявлення мають однаковий `id`, зберігається лише маніфест **з найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет, від найвищого до найнижчого:

1. **Вибраний конфігурацією** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — plugins, що постачаються разом з OpenClaw
3. **Глобальне встановлення** — plugins, встановлені в глобальний корінь plugins OpenClaw
4. **Робочий простір** — plugins, виявлені відносно поточного робочого простору

Наслідки:

- Форкнута або застаріла копія вбудованого plugin, що лежить у робочому просторі, не зможе затінити вбудовану збірку.
- Щоб справді перевизначити вбудований plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтесь на виявлення в робочому просторі.
- Відкидання дублікатів логуються, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен plugin має постачатися з JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня schema прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Schemas проходять валідацію під час читання/запису конфігурації, а не під час виконання.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки id каналу не оголошено
  маніфестом plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **такі, що можуть бути виявлені**, id plugin. Невідомі id є **помилками**.
- Якщо plugin встановлено, але він має зламаний або відсутній маніфест чи schema,
  валідація завершується помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнений**, конфігурація зберігається, і
  в Doctor + логах показується **попередження**.

Повну schema `plugins.*` див. у [Configuration reference](/uk/gateway/configuration).

## Примітки

- Маніфест **обов’язковий для рідних plugins OpenClaw**, зокрема для локальних завантажень із файлової системи. Runtime і далі окремо завантажує модуль plugin; маніфест використовується лише для виявлення + валідації.
- Рідні маніфести парсяться як JSON5, тому коментарі, завершальні коми й ключі без лапок приймаються, якщо фінальне значення все одно є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте користувацьких ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо plugin їх не потребує.
- Ексклюзивні типи plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типове значення `legacy`).
- Метадані env vars (`providerAuthEnvVars`, `channelEnvVars`) є лише декларативними. Поверхні status, audit, валідації доставки Cron та інші read-only поверхні все одно застосовують довіру до plugin і політику ефективної активації, перш ніж вважати env var налаштованою.
- Для метаданих runtime wizard, які потребують коду провайдера, див. [Provider runtime hooks](/uk/plugins/architecture#provider-runtime-hooks).
- Якщо ваш plugin залежить від native modules, задокументуйте кроки збірки та будь-які вимоги до allowlist пакетного менеджера (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення plugins" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з plugins.
  </Card>
  <Card title="Архітектура plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник Plugin SDK і subpath-імпорти.
  </Card>
</CardGroup>
