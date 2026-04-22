---
read_when:
    - Ви створюєте plugin для OpenClaw
    - Вам потрібно надати схему конфігурації plugin або налагодити помилки валідації plugin
summary: Вимоги до маніфесту Plugin і JSON schema (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-22T07:00:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 085c1baccb96b8e6bd4033ad11bdd5f79bdb0daec470e977fce723c3ae38cc99
    source_path: plugins/manifest.md
    workflow: 15
---

# Маніфест Plugin (`openclaw.plugin.json`)

Ця сторінка стосується лише **власного маніфесту plugin OpenClaw**.

Сумісні макети пакетів дивіться в [Пакети Plugin](/uk/plugins/bundles).

Сумісні формати пакетів використовують інші файли маніфесту:

- пакет Codex: `.codex-plugin/plugin.json`
- пакет Claude: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- пакет Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети пакетів, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних пакетів OpenClaw наразі читає метадані пакета разом з оголошеними
коренями skill, коренями команд Claude, типовими значеннями Claude package `settings.json`,
типовими значеннями Claude package LSP та підтримуваними наборами hook, коли макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен власний plugin OpenClaw **повинен** містити файл `openclaw.plugin.json` у
**корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду plugin**. Відсутні або некоректні маніфести вважаються
помилками plugin і блокують валідацію конфігурації.

Дивіться повний посібник із системи plugin: [Plugins](/uk/tools/plugin).
Щодо власної моделі можливостей і поточних рекомендацій із зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує перед завантаженням коду
вашого plugin.

Використовуйте його для:

- ідентифікації plugin
- валідації конфігурації
- метаданих автентифікації та онбордингу, які мають бути доступні без запуску
  середовища виконання plugin
- недорогих підказок активації, які поверхні control-plane можуть перевіряти до
  завантаження середовища виконання
- недорогих дескрипторів налаштування, які поверхні налаштування/онбордингу можуть
  перевіряти до завантаження середовища виконання
- метаданих псевдонімів та автоувімкнення, які мають визначатися до завантаження
  середовища виконання plugin
- скорочених метаданих належності до сімейства моделей, які мають автоматично
  активувати plugin до завантаження середовища виконання
- статичних знімків належності можливостей, що використовуються для сумісної
  інтеграції вбудованих компонентів і покриття контрактів
- недорогих метаданих QA runner, які спільний хост `openclaw qa` може перевіряти
  до завантаження середовища виконання plugin
- метаданих конфігурації, специфічних для каналу, які мають об’єднуватися в каталог
  і поверхні валідації без завантаження середовища виконання
- підказок UI для конфігурації

Не використовуйте його для:

- реєстрації поведінки середовища виконання
- оголошення точок входу коду
- метаданих встановлення npm

Вони мають належати коду вашого plugin і `package.json`.

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

| Поле                                 | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                              |
| ------------------------------------ | ----------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                 | Так         | `string`                         | Канонічний ідентифікатор plugin. Це ідентифікатор, який використовується в `plugins.entries.<id>`.                                                                                                          |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                         |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований plugin як увімкнений за замовчуванням. Не вказуйте це поле або встановіть будь-яке значення, відмінне від `true`, щоб plugin залишався вимкненим за замовчуванням.                     |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі ідентифікатори, які нормалізуються до цього канонічного ідентифікатора plugin.                                                                                                                    |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Ідентифікатори provider, які мають автоматично вмикати цей plugin, коли автентифікація, конфігурація або посилання на моделі згадують їх.                                                                  |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує винятковий тип plugin, який використовується `plugins.slots.*`.                                                                                                                                     |
| `channels`                           | Ні          | `string[]`                       | Ідентифікатори channel, якими володіє цей plugin. Використовується для виявлення та валідації конфігурації.                                                                                                 |
| `providers`                          | Ні          | `string[]`                       | Ідентифікатори provider, якими володіє цей plugin.                                                                                                                                                           |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейства моделей, що належать маніфесту, і використовуються для автоматичного завантаження plugin до запуску середовища виконання.                                                     |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані хостів endpoint/baseUrl, що належать маніфесту, для маршрутів provider, які ядро має класифікувати до завантаження середовища виконання provider.                                                 |
| `cliBackends`                        | Ні          | `string[]`                       | Ідентифікатори backend CLI inference, якими володіє цей plugin. Використовується для автоактивації під час запуску з явних посилань у конфігурації.                                                        |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на provider або backend CLI, для яких слід перевіряти синтетичний hook автентифікації, що належить plugin, під час холодного виявлення моделей до завантаження середовища виконання.           |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API key, що належать вбудованому plugin і представляють не секретний локальний стан, OAuth або стан облікових даних середовища.                                                       |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, що належать цьому plugin і мають створювати діагностику конфігурації та CLI з урахуванням plugin до завантаження середовища виконання.                                                       |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Недорогі метадані env для автентифікації provider, які OpenClaw може перевіряти без завантаження коду plugin.                                                                                              |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Ідентифікатори provider, які мають повторно використовувати інший ідентифікатор provider для пошуку автентифікації, наприклад provider для кодування, який ділить API key і профілі автентифікації з базовим provider. |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Недорогі метадані env для channel, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для налаштування channel або поверхонь автентифікації, керованих env, які мають бачити загальні допоміжні засоби запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Недорогі метадані варіантів автентифікації для засобів вибору під час онбордингу, визначення бажаного provider і простого підключення прапорців CLI.                                                       |
| `activation`                         | Ні          | `object`                         | Недорогі підказки активації для завантаження, ініційованого provider, командою, channel, маршрутом і можливістю. Лише метадані; фактична поведінка все одно належить середовищу виконання plugin.         |
| `setup`                              | Ні          | `object`                         | Недорогі дескриптори налаштування/онбордингу, які поверхні виявлення та налаштування можуть перевіряти без завантаження середовища виконання plugin.                                                       |
| `qaRunners`                          | Ні          | `object[]`                       | Недорогі дескриптори QA runner, які використовуються спільним хостом `openclaw qa` до завантаження середовища виконання plugin.                                                                            |
| `contracts`                          | Ні          | `object`                         | Статичний знімок вбудованих можливостей для speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння інструментами. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Недорогі типові значення media-understanding для ідентифікаторів provider, оголошених у `contracts.mediaUnderstandingProviders`.                                                                            |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації channel, що належать маніфесту, об’єднуються в поверхні виявлення та валідації до завантаження середовища виконання.                                                                  |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня plugin.                                                                                                                                                    |
| `name`                               | Ні          | `string`                         | Зрозуміла людині назва plugin.                                                                                                                                                                                |
| `description`                        | Ні          | `string`                         | Короткий підсумок, що показується в поверхнях plugin.                                                                                                                                                         |
| `version`                            | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                   |
| `uiHints`                            | Ні          | `Record<string, object>`         | Мітки UI, placeholders і підказки чутливості для полів конфігурації.                                                                                                                                         |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або автентифікації.
OpenClaw зчитує це до завантаження середовища виконання provider.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Ідентифікатор provider, до якого належить цей варіант.                                                    |
| `method`              | Так         | `string`                                        | Ідентифікатор методу автентифікації, до якого слід спрямовувати.                                          |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор варіанта автентифікації, який використовується під час онбордингу та в CLI.     |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо не вказано, OpenClaw використовує `choiceId`.                                 |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для засобу вибору.                                                              |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються вище в інтерактивних засобах вибору, керованих помічником.                     |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує цей варіант із засобів вибору помічника, але все ще дозволяє ручний вибір через CLI.            |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори варіантів, які мають перенаправляти користувачів до цього варіанта-заміни.      |
| `groupId`             | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для пов’язаних варіантів.                                              |
| `groupLabel`          | Ні          | `string`                                        | Мітка для цієї групи, видима користувачу.                                                                 |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                      |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих сценаріїв автентифікації з одним прапорцем.                         |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                     |
| `cliOption`           | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                        |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                                |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | На яких поверхнях онбордингу має з’являтися цей варіант. Якщо не вказано, типово використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє назвою команди середовища виконання, яку користувачі можуть
помилково вказати в `plugins.allow` або спробувати виконати як кореневу команду CLI. OpenClaw
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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                                |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------------ |
| `name`       | Так         | `string`          | Назва команди, яка належить цьому plugin.                                      |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не як кореневу команду CLI.        |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід запропонувати для операцій CLI, якщо вона існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може недорого оголосити, які події control-plane
мають активувати його пізніше.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або кілька transport runner у межах
спільного кореня `openclaw qa`. Зберігайте ці метадані недорогими та статичними; фактична
реєстрація CLI все одно належить середовищу виконання plugin через легку поверхню
`runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Запустити живий QA lane Matrix на основі Docker проти тимчасового homeserver"
    }
  ]
}
```

| Поле          | Обов’язкове | Тип      | Що воно означає                                                          |
| ------------- | ----------- | -------- | ------------------------------------------------------------------------ |
| `commandName` | Так         | `string` | Підкоманда, змонтована в `openclaw qa`, наприклад `matrix`.              |
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

Цей блок є лише метаданими. Він не реєструє поведінку середовища виконання і не
замінює `register(...)`, `setupEntry` чи інші точки входу середовища виконання/plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням plugin, тому
відсутність метаданих активації зазвичай впливає лише на продуктивність; це не повинно
змінювати коректність, доки все ще існують застарілі резервні механізми володіння маніфестом.

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
| `onProviders`    | Ні          | `string[]`                                           | Ідентифікатори provider, які мають активувати цей plugin за запитом. |
| `onCommands`     | Ні          | `string[]`                                           | Ідентифікатори команд, які мають активувати цей plugin.           |
| `onChannels`     | Ні          | `string[]`                                           | Ідентифікатори channel, які мають активувати цей plugin.          |
| `onRoutes`       | Ні          | `string[]`                                           | Типи route, які мають активувати цей plugin.                      |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки можливостей, що використовуються під час планування активації control-plane. |

Поточні активні споживачі:

- планування CLI, ініційоване командою, використовує як резервний варіант
  застарілі `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/channel, ініційоване channel, використовує як резервний варіант
  застаріле володіння `channels[]`, коли явні метадані активації channel відсутні
- планування setup/runtime, ініційоване provider, використовує як резервний варіант
  застаріле володіння `providers[]` і верхньорівневими `cliBackends[]`, коли явні метадані
  активації provider відсутні

## Довідник `setup`

Використовуйте `setup`, коли поверхням налаштування та онбордингу потрібні недорогі метадані plugin
до завантаження середовища виконання.

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

Верхньорівневий `cliBackends` залишається коректним і надалі описує backend CLI inference.
`setup.cliBackends` — це поверхня дескрипторів, специфічна для setup, для потоків
control-plane/setup, яка має залишатися лише метаданими.

Якщо вони присутні, `setup.providers` і `setup.cliBackends` є бажаною поверхнею пошуку
на основі дескрипторів для виявлення setup. Якщо дескриптор лише звужує коло кандидатів plugin, а для setup
усе ще потрібні багатші hook середовища виконання на етапі налаштування, установіть `requiresRuntime: true`
і збережіть `setup-api` як резервний шлях виконання.

Оскільки пошук setup може виконувати код `setup-api`, що належить plugin, нормалізовані значення
`setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед усіх
виявлених plugin. Неоднозначне володіння призводить до безпечної відмови замість вибору
переможця за порядком виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                        |
| ------------- | ----------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | Ідентифікатор provider, який показується під час setup або онбордингу. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Ідентифікатори методів setup/auth, які цей provider підтримує без завантаження повного середовища виконання. |
| `envVars`     | Ні          | `string[]` | Env vars, які загальні поверхні setup/status можуть перевіряти до завантаження середовища виконання plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                       |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup provider, доступні під час setup та онбордингу.                                     |
| `cliBackends`      | Ні          | `string[]` | Ідентифікатори backend для етапу setup, що використовуються для пошуку setup на основі дескрипторів. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Ідентифікатори міграцій конфігурації, якими володіє поверхня setup цього plugin.                      |
| `requiresRuntime`  | Ні          | `boolean`  | Чи все ще потрібне виконання `setup-api` після пошуку за дескриптором.                                |

## Довідник `uiHints`

`uiHints` — це мапа від назв полів конфігурації до невеликих підказок рендерингу.

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

Кожна підказка для поля може містити:

| Поле          | Тип        | Що воно означає                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Мітка поля, видима користувачу.         |
| `help`        | `string`   | Короткий допоміжний текст.              |
| `tags`        | `string[]` | Необов’язкові теги UI.                  |
| `advanced`    | `boolean`  | Позначає поле як розширене.             |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.  |
| `placeholder` | `string`   | Текст placeholder для полів форми.      |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
зчитувати без імпорту середовища виконання plugin.

```json
{
  "contracts": {
    "embeddedExtensionFactories": ["pi"],
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

| Поле                             | Тип        | Що воно означає                                                           |
| -------------------------------- | ---------- | ------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ідентифікатори вбудованого середовища виконання, для яких вбудований plugin може реєструвати фабрики. |
| `speechProviders`                | `string[]` | Ідентифікатори speech provider, якими володіє цей plugin.                 |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори provider для realtime transcription, якими володіє цей plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори provider для realtime voice, якими володіє цей plugin.     |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори provider для media-understanding, якими володіє цей plugin. |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори provider для image-generation, якими володіє цей plugin.   |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори provider для video-generation, якими володіє цей plugin.   |
| `webFetchProviders`              | `string[]` | Ідентифікатори provider для web-fetch, якими володіє цей plugin.          |
| `webSearchProviders`             | `string[]` | Ідентифікатори provider для web search, якими володіє цей plugin.         |
| `tools`                          | `string[]` | Назви agent tool, якими володіє цей plugin, для перевірок контрактів вбудованих компонентів. |

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли provider для media-understanding має
типові моделі, пріоритет резервного автоавтентифікування або нативну підтримку документів,
які потрібні загальним допоміжним засобам ядра до завантаження середовища виконання. Ключі також мають бути оголошені в
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

| Поле                   | Тип                                 | Що воно означає                                                             |
| ---------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Можливості медіа, які надає цей provider.                                   |
| `defaultModels`        | `Record<string, string>`            | Типові відповідності можливість-модель, які використовуються, коли конфігурація не вказує модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору provider на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні вхідні формати документів, які підтримує provider.                  |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли channel plugin потребує недорогих метаданих конфігурації
до завантаження середовища виконання.

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
      "description": "Підключення до homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Кожен запис channel може містити:

| Поле          | Тип                      | Що воно означає                                                                         |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації channel. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/placeholders/підказки чутливості для цього розділу конфігурації channel. |
| `label`       | `string`                 | Мітка channel, яка об’єднується в поверхні вибору та інспекції, коли метадані середовища виконання ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь інспекції та каталогу.                              |
| `preferOver`  | `string[]`               | Ідентифікатори застарілих або менш пріоритетних plugin, які цей channel має перевершувати на поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має визначати ваш provider plugin за
скороченими ідентифікаторами моделей, як-от `gpt-5.4` або `claude-sonnet-4.6`, до завантаження
середовища виконання plugin.

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
- якщо збігаються один невбудований plugin і один вбудований plugin, перемагає невбудований
  plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не вкаже provider

Поля:

| Поле            | Тип        | Що воно означає                                                                |
| --------------- | ---------- | ------------------------------------------------------------------------------ |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими ідентифікаторами моделей. |
| `modelPatterns` | `string[]` | Джерела regex, які зіставляються зі скороченими ідентифікаторами моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня більше не рекомендуються. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` у `contracts`; звичайне
завантаження маніфесту більше не розглядає ці поля верхнього рівня як
володіння можливостями.

## Маніфест проти package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів автентифікації та підказки UI, які мають існувати до запуску коду plugin |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, який використовується для точок входу, обмежень встановлення, setup або метаданих каталогу |

Якщо ви не впевнені, куди належить певний фрагмент метаданих, користуйтеся таким правилом:

- якщо OpenClaw має знати це до завантаження коду plugin, розмістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів точок входу або поведінки встановлення npm, розмістіть це в `package.json`

### Поля package.json, які впливають на виявлення

Деякі метадані plugin до запуску середовища виконання навмисно зберігаються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                        |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує точки входу власних plugin. Має залишатися в каталозі пакета plugin.                                                                                                        |
| `openclaw.runtimeExtensions`                                      | Оголошує точки входу built JavaScript runtime для встановлених пакетів. Має залишатися в каталозі пакета plugin.                                                                     |
| `openclaw.setupEntry`                                             | Легка точка входу лише для setup, яка використовується під час онбордингу, відкладеного запуску channel і виявлення status/SecretRef channel лише для читання. Має залишатися в каталозі пакета plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує точку входу built JavaScript setup для встановлених пакетів. Має залишатися в каталозі пакета plugin.                                                                       |
| `openclaw.channel`                                                | Недорогі метадані каталогу channel, як-от мітки, шляхи до документації, псевдоніми та текст для вибору.                                                                              |
| `openclaw.channel.configuredState`                                | Недорогі метадані перевірки configured-state, які можуть відповісти на запитання «чи вже існує налаштування лише через env?» без завантаження повного середовища виконання channel. |
| `openclaw.channel.persistedAuthState`                             | Недорогі метадані перевірки persisted-auth, які можуть відповісти на запитання «чи вже є якийсь активний вхід?» без завантаження повного середовища виконання channel.             |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки для встановлення/оновлення вбудованих і зовнішньо опублікованих plugin.                                                                                                      |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw з використанням нижньої межі semver, наприклад `>=2026.3.22`.                                                                         |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення вбудованого plugin, коли конфігурація некоректна.                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для setup завантажуватися до повного channel plugin під час запуску.                                                                                 |

`openclaw.install.minHostVersion` застосовується під час встановлення та
завантаження реєстру маніфестів. Некоректні значення відхиляються; новіші, але коректні значення пропускають
plugin на старіших хостах.

Channel plugin мають надавати `openclaw.setupEntry`, коли сканування status, списку channel
або SecretRef має визначати налаштовані облікові записи без завантаження повного
середовища виконання. Точка входу setup має надавати метадані channel разом із безпечними для setup адаптерами
конфігурації, status і secrets; мережеві клієнти, слухачі Gateway і
transport runtime слід залишати в основній точці входу extension.

Поля точки входу runtime не обходять перевірки меж пакета для полів
вихідної точки входу. Наприклад, `openclaw.runtimeExtensions` не може зробити
доступним для завантаження шлях `openclaw.extensions`, що виходить за межі.

`openclaw.install.allowInvalidConfigRecovery` навмисно має вузьке призначення. Воно
не робить довільно зламані конфігурації придатними до встановлення. Наразі воно лише дозволяє
процесам встановлення відновлюватися після конкретних застарілих збоїв оновлення вбудованих plugin,
наприклад відсутнього шляху до вбудованого plugin або застарілого запису `channels.<id>` для того самого
вбудованого plugin. Непов’язані помилки конфігурації й надалі блокують встановлення та спрямовують операторів
до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це метадані пакета для маленького модуля перевірки:

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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна недорога
перевірка автентифікації типу yes/no до завантаження повного channel plugin. Цільовий export має бути невеликою
функцією, яка лише читає збережений стан; не спрямовуйте її через повний barrel
середовища виконання channel.

`openclaw.channel.configuredState` має таку саму форму для недорогих перевірок
configured-state лише через env:

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

Використовуйте це, коли channel може визначити configured-state з env або інших малих
не-runtime входів. Якщо перевірці потрібне повне визначення конфігурації або реальне
середовище виконання channel, залишайте цю логіку в hook `config.hasConfiguredState`
plugin.

## Пріоритет виявлення (дубльовані ідентифікатори plugin)

OpenClaw виявляє plugin із кількох коренів (вбудовані, глобальне встановлення, workspace, явно вибрані в конфігурації шляхи). Якщо два знайдені plugin мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет, від найвищого до найнижчого:

1. **Вибраний у конфігурації** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — plugin, які постачаються разом з OpenClaw
3. **Глобальне встановлення** — plugin, встановлені в глобальний корінь plugin OpenClaw
4. **Workspace** — plugin, виявлені відносно поточного workspace

Наслідки:

- Форк або застаріла копія вбудованого plugin, що лежить у workspace, не зможе затінити вбудовану збірку.
- Щоб справді перевизначити вбудований plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтеся на виявлення у workspace.
- Відкидання дублікатів логуються, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен plugin повинен містити JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема допустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми проходять валідацію під час читання/запису конфігурації, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки ідентифікатор channel не оголошений
  у маніфесті plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **виявлювані** ідентифікатори plugin. Невідомі ідентифікатори є **помилками**.
- Якщо plugin встановлено, але він має зламаний або відсутній маніфест чи schema,
  валідація завершується помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнено**, конфігурація зберігається, і
  в Doctor + логах з’являється **попередження**.

Повну схему `plugins.*` дивіться в [Довіднику з конфігурації](/uk/gateway/configuration).

## Примітки

- Маніфест є **обов’язковим для власних plugin OpenClaw**, зокрема для локальних завантажень із файлової системи.
- Runtime все одно завантажує модуль plugin окремо; маніфест використовується лише для
  виявлення + валідації.
- Власні маніфести парсяться за допомогою JSON5, тому коментарі, кінцеві коми та
  ключі без лапок дозволені, якщо підсумкове значення все ще є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте додавання
  тут власних ключів верхнього рівня.
- `providerAuthEnvVars` — це недорогий шлях метаданих для перевірок автентифікації, валідації
  env-marker і подібних поверхонь автентифікації provider, які не повинні запускати
  середовище виконання plugin лише для перевірки назв env.
- `providerAuthAliases` дозволяє варіантам provider повторно використовувати env vars
  автентифікації, профілі автентифікації, автентифікацію на основі конфігурації та варіант
  онбордингу API key іншого provider без жорсткого кодування цього зв’язку в ядрі.
- `providerEndpoints` дозволяє plugin provider володіти простими метаданими зіставлення
  хостів endpoint/baseUrl. Використовуйте це лише для класів endpoint, які ядро вже підтримує;
  поведінка runtime все одно належить plugin.
- `syntheticAuthRefs` — це недорогий шлях метаданих для синтетичних hook автентифікації,
  що належать provider і мають бути видимі для холодного виявлення моделей до появи
  реєстру runtime. Перелічуйте лише ті посилання, чий runtime provider або backend CLI
  справді реалізує `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` — це недорогий шлях метаданих для значень-заповнювачів API key,
  що належать вбудованому plugin, як-от маркери локальних, OAuth або середовищних облікових даних.
  Ядро трактує їх як не секретні для відображення автентифікації та аудитів секретів без
  жорсткого кодування provider-власника.
- `channelEnvVars` — це недорогий шлях метаданих для shell-env fallback, підказок setup
  та подібних поверхонь channel, які не повинні запускати середовище виконання plugin
  лише для перевірки назв env. Назви env — це метадані, а не активація
  самі по собі: status, audit, валідація доставки Cron та інші поверхні
  лише для читання все одно застосовують політику довіри plugin і ефективної активації, перш ніж
  трактувати env var як налаштований channel.
- `providerAuthChoices` — це недорогий шлях метаданих для засобів вибору варіантів автентифікації,
  визначення `--auth-choice`, мапінгу бажаного provider і простої реєстрації
  прапорців CLI для онбордингу до завантаження середовища виконання provider. Для метаданих
  runtime wizard, які потребують коду provider, дивіться
  [hook середовища виконання Provider](/uk/plugins/architecture#provider-runtime-hooks).
- Виняткові типи plugin вибираються через `plugins.slots.*`.
  - `kind: "memory"` вибирається через `plugins.slots.memory`.
  - `kind: "context-engine"` вибирається через `plugins.slots.contextEngine`
    (типово: вбудований `legacy`).
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо
  plugin їх не потребує.
- Якщо ваш plugin залежить від нативних модулів, задокументуйте кроки збірки та всі
  вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Пов’язане

- [Створення Plugins](/uk/plugins/building-plugins) — початок роботи з plugin
- [Архітектура Plugin](/uk/plugins/architecture) — внутрішня архітектура
- [Огляд SDK](/uk/plugins/sdk-overview) — довідник по SDK Plugin
