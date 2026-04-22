---
read_when:
    - Ви створюєте plugin для OpenClaw
    - Вам потрібно постачати схему конфігурації plugin або налагоджувати помилки валідації plugin
summary: Вимоги до маніфесту Plugin і JSON schema (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-22T00:52:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 52a52f7e2c78bbef2cc51ade6eb12b6edc950237bdfc478f6e82248374c687bf
    source_path: plugins/manifest.md
    workflow: 15
---

# Маніфест Plugin (`openclaw.plugin.json`)

Ця сторінка стосується лише **власного маніфесту plugin OpenClaw**.

Сумісні макети bundle описані в [Plugin bundles](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети bundle, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі читає метадані bundle разом із оголошеними
коренями skill, коренями команд Claude, значеннями за замовчуванням з `settings.json`
у Claude bundle, значеннями за замовчуванням Claude bundle LSP та підтримуваними
наборами hook, якщо макет відповідає очікуванням рантайму OpenClaw.

Кожен власний plugin OpenClaw **повинен** постачатися з файлом `openclaw.plugin.json`
у **корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду plugin**. Відсутні або невалідні маніфести вважаються
помилками plugin і блокують валідацію конфігурації.

Повний посібник із системи plugin дивіться тут: [Plugins](/uk/tools/plugin).
Щодо власної моделі можливостей і поточних рекомендацій щодо зовнішньої сумісності:
[Capability model](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає перед завантаженням коду
вашого plugin.

Використовуйте його для:

- ідентичності plugin
- валідації конфігурації
- метаданих auth і onboarding, які мають бути доступні без запуску рантайму plugin
- дешевих підказок активації, які поверхні control-plane можуть перевіряти до завантаження рантайму
- дешевих дескрипторів налаштування, які поверхні setup/onboarding можуть перевіряти до завантаження рантайму
- метаданих alias та auto-enable, які мають визначатися до завантаження рантайму plugin
- скорочених метаданих володіння сімейством моделей, які мають автоматично активувати plugin до завантаження рантайму
- статичних знімків володіння можливостями, що використовуються для wiring сумісності вбудованих компонентів і покриття контрактів
- дешевих метаданих QA runner, які спільний хост `openclaw qa` може перевіряти до завантаження рантайму plugin
- метаданих конфігурації, специфічних для channel, які мають об’єднуватися в поверхні каталогу та валідації без завантаження рантайму
- підказок для UI конфігурації

Не використовуйте його для:

- реєстрації поведінки рантайму
- оголошення точок входу коду
- метаданих встановлення npm

Це має бути у коді вашого plugin і в `package.json`.

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
| ----------------------------------- | ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | Так         | `string`                         | Канонічний ідентифікатор plugin. Це ідентифікатор, який використовується в `plugins.entries.<id>`.                                                                                                         |
| `configSchema`                      | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                        |
| `enabledByDefault`                  | Ні          | `true`                           | Позначає вбудований plugin як увімкнений за замовчуванням. Не вказуйте його або встановіть будь-яке значення, відмінне від `true`, щоб plugin залишався вимкненим за замовчуванням.                    |
| `legacyPluginIds`                   | Ні          | `string[]`                       | Застарілі ідентифікатори, які нормалізуються до цього канонічного ідентифікатора plugin.                                                                                                                  |
| `autoEnableWhenConfiguredProviders` | Ні          | `string[]`                       | Ідентифікатори provider, які мають автоматично вмикати цей plugin, коли auth, конфігурація або посилання на моделі згадують їх.                                                                          |
| `kind`                              | Ні          | `"memory"` \| `"context-engine"` | Оголошує виключний тип plugin, який використовується `plugins.slots.*`.                                                                                                                                     |
| `channels`                          | Ні          | `string[]`                       | Ідентифікатори channel, якими володіє цей plugin. Використовується для виявлення та валідації конфігурації.                                                                                               |
| `providers`                         | Ні          | `string[]`                       | Ідентифікатори provider, якими володіє цей plugin.                                                                                                                                                          |
| `modelSupport`                      | Ні          | `object`                         | Скорочені метадані сімейства моделей, що належать маніфесту та використовуються для автоматичного завантаження plugin до запуску рантайму.                                                               |
| `providerEndpoints`                 | Ні          | `object[]`                       | Метадані host/baseUrl маршрутів provider, що належать маніфесту та мають бути класифіковані ядром до завантаження рантайму provider.                                                                     |
| `cliBackends`                       | Ні          | `string[]`                       | Ідентифікатори backend CLI inference, якими володіє цей plugin. Використовується для автоматичної активації під час запуску з явних посилань у конфігурації.                                            |
| `syntheticAuthRefs`                 | Ні          | `string[]`                       | Посилання provider або backend CLI, для яких має перевірятися synthetic auth hook, що належить plugin, під час холодного виявлення моделей до завантаження рантайму.                                    |
| `nonSecretAuthMarkers`              | Ні          | `string[]`                       | Значення-заповнювачі API key, що належать вбудованому plugin і представляють несекретний локальний стан, OAuth або стан ambient credential.                                                               |
| `commandAliases`                    | Ні          | `object[]`                       | Назви команд, якими володіє цей plugin і які мають генерувати діагностику конфігурації та CLI з урахуванням plugin до завантаження рантайму.                                                             |
| `providerAuthEnvVars`               | Ні          | `Record<string, string[]>`       | Легкі метадані env для auth provider, які OpenClaw може перевіряти без завантаження коду plugin.                                                                                                          |
| `providerAuthAliases`               | Ні          | `Record<string, string>`         | Ідентифікатори provider, які мають повторно використовувати інший ідентифікатор provider для пошуку auth, наприклад provider для кодування, який використовує той самий API key і профілі auth базового provider. |
| `channelEnvVars`                    | Ні          | `Record<string, string[]>`       | Легкі метадані env для channel, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для поверхонь налаштування channel або auth на основі env, які мають бачити загальні помічники запуску/конфігурації. |
| `providerAuthChoices`               | Ні          | `object[]`                       | Легкі метадані варіантів auth для засобів вибору під час onboarding, визначення preferred provider і простої прив’язки прапорців CLI.                                                                     |
| `activation`                        | Ні          | `object`                         | Легкі підказки активації для завантаження, що запускається provider, командою, channel, маршрутом і можливістю. Лише метадані; фактична поведінка й надалі належить рантайму plugin.                     |
| `setup`                             | Ні          | `object`                         | Легкі дескриптори setup/onboarding, які поверхні виявлення та налаштування можуть перевіряти без завантаження рантайму plugin.                                                                            |
| `qaRunners`                         | Ні          | `object[]`                       | Легкі дескриптори QA runner, які використовуються спільним хостом `openclaw qa` до завантаження рантайму plugin.                                                                                          |
| `contracts`                         | Ні          | `object`                         | Статичний знімок можливостей вбудованого компонента для володіння speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і tool. |
| `channelConfigs`                    | Ні          | `Record<string, object>`         | Метадані конфігурації channel, що належать маніфесту та об’єднуються в поверхні виявлення й валідації до завантаження рантайму.                                                                           |
| `skills`                            | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня plugin.                                                                                                                                                   |
| `name`                              | Ні          | `string`                         | Зрозуміла для людини назва plugin.                                                                                                                                                                          |
| `description`                       | Ні          | `string`                         | Короткий опис, який показується в поверхнях plugin.                                                                                                                                                         |
| `version`                           | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                 |
| `uiHints`                           | Ні          | `Record<string, object>`         | Підписи UI, placeholders і підказки чутливості для полів конфігурації.                                                                                                                                      |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант onboarding або auth.
OpenClaw читає це до завантаження рантайму provider.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                  |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `provider`            | Так         | `string`                                        | Ідентифікатор provider, до якого належить цей варіант.                                           |
| `method`              | Так         | `string`                                        | Ідентифікатор методу auth, до якого слід маршрутизувати.                                         |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор варіанта auth, що використовується в onboarding і CLI-потоках.         |
| `choiceLabel`         | Ні          | `string`                                        | Підпис для користувача. Якщо не вказано, OpenClaw використовує `choiceId`.                       |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для picker.                                                            |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних picker, керованих асистентом.                   |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант у picker асистента, але все ще дозволяє ручний вибір через CLI.                 |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори варіантів, які мають перенаправляти користувачів на цей варіант-заміну. |
| `groupId`             | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для пов’язаних варіантів.                                     |
| `groupLabel`          | Ні          | `string`                                        | Підпис для користувача для цієї групи.                                                           |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                             |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ опції для простих auth-потоків з одним прапорцем.                                |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                            |
| `cliOption`           | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                   |
| `cliDescription`      | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                         |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях onboarding має з’являтися цей варіант. Якщо не вказано, використовується значення за замовчуванням `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє назвою runtime-команди, яку користувачі можуть
помилково вказати в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
використовує ці метадані для діагностики без імпорту коду рантайму plugin.

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

| Поле         | Обов’язкове | Тип              | Що воно означає                                                         |
| ------------ | ----------- | ---------------- | ----------------------------------------------------------------------- |
| `name`       | Так         | `string`         | Назва команди, яка належить цьому plugin.                               |
| `kind`       | Ні          | `"runtime-slash"` | Позначає alias як slash-команду чату, а не як кореневу команду CLI.     |
| `cliCommand` | Ні          | `string`         | Пов’язана коренева команда CLI, яку слід запропонувати для операцій CLI, якщо така існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може дешево оголосити, які події control-plane
мають активувати його пізніше.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або кілька transport runner під спільним
коренем `openclaw qa`. Зберігайте ці метадані легкими та статичними; фактична реєстрація CLI
все ще належить рантайму plugin через легку поверхню `runtime-api.ts`, яка експортує
`qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Запустити Docker-backed Matrix live QA lane на disposable homeserver"
    }
  ]
}
```

| Поле          | Обов’язкове | Тип      | Що воно означає                                                     |
| ------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.       |
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

Цей блок містить лише метадані. Він не реєструє поведінку рантайму і не
замінює `register(...)`, `setupEntry` або інші точки входу рантайму/plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим
завантаженням plugin, тому відсутність метаданих активації зазвичай впливає
лише на продуктивність; це не повинно змінювати коректність, доки все ще існують
застарілі fallback-механізми володіння маніфестом.

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

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                 |
| ---------------- | ----------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| `onProviders`    | Ні          | `string[]`                                           | Ідентифікатори provider, які мають активувати цей plugin за запитом. |
| `onCommands`     | Ні          | `string[]`                                           | Ідентифікатори команд, які мають активувати цей plugin.         |
| `onChannels`     | Ні          | `string[]`                                           | Ідентифікатори channel, які мають активувати цей plugin.        |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають активувати цей plugin.                |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки можливостей, що використовуються під час планування активації control-plane. |

Поточні активні споживачі:

- планування CLI, що запускається командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/channel, що запускається channel, повертається до застарілого
  володіння `channels[]`, якщо явні метадані активації channel відсутні
- планування setup/runtime, що запускається provider, повертається до застарілого
  володіння `providers[]` і верхньорівневого `cliBackends[]`, якщо явні метадані
  активації provider відсутні

## Довідник `setup`

Використовуйте `setup`, коли поверхням setup і onboarding потрібні легкі метадані plugin до завантаження рантайму.

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

Верхньорівневий `cliBackends` залишається валідним і надалі описує backend CLI inference. `setup.cliBackends` — це поверхня дескрипторів, специфічна для setup, для потоків control-plane/setup, яка має залишатися лише на рівні метаданих.

Якщо присутні `setup.providers` і `setup.cliBackends`, вони є бажаною поверхнею пошуку setup за принципом descriptor-first для виявлення setup. Якщо дескриптор лише звужує кандидатний plugin, а setup усе ще потребує багатших runtime hook під час setup, встановіть `requiresRuntime: true` і залиште `setup-api` як резервний шлях виконання.

Оскільки пошук setup може виконувати код `setup-api`, що належить plugin, нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед виявлених plugin. Неоднозначне володіння завершується закритою відмовою замість вибору переможця за порядком виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                   |
| ------------- | ----------- | ---------- | ---------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | Ідентифікатор provider, який показується під час setup або onboarding. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Ідентифікатори методів setup/auth, які цей provider підтримує без завантаження повного рантайму. |
| `envVars`     | Ні          | `string[]` | Env vars, які загальні поверхні setup/status можуть перевіряти до завантаження рантайму plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                   |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup provider, які показуються під час setup та onboarding.                         |
| `cliBackends`      | Ні          | `string[]` | Ідентифікатори backend для часу setup, що використовуються для пошуку setup за принципом descriptor-first. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Ідентифікатори міграцій конфігурації, що належать поверхні setup цього plugin.                   |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку дескриптора.                                |

## Довідник `uiHints`

`uiHints` — це мапа від назв полів конфігурації до невеликих підказок для рендерингу.

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

| Поле          | Тип        | Що воно означає                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Підпис поля для користувача.            |
| `help`        | `string`   | Короткий допоміжний текст.              |
| `tags`        | `string[]` | Необов’язкові теги UI.                  |
| `advanced`    | `boolean`  | Позначає поле як розширене.             |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.  |
| `placeholder` | `string`   | Текст placeholder для полів форми.      |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може читати без імпорту рантайму plugin.

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

| Поле                             | Тип        | Що воно означає                                                   |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Ідентифікатори speech provider, якими володіє цей plugin.         |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори provider для realtime-transcription, якими володіє цей plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори provider для realtime-voice, якими володіє цей plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори provider для media-understanding, якими володіє цей plugin. |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори provider для image-generation, якими володіє цей plugin. |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори provider для video-generation, якими володіє цей plugin. |
| `webFetchProviders`              | `string[]` | Ідентифікатори provider для web-fetch, якими володіє цей plugin.  |
| `webSearchProviders`             | `string[]` | Ідентифікатори provider для web-search, якими володіє цей plugin. |
| `tools`                          | `string[]` | Назви agent tool, якими володіє цей plugin для перевірок контрактів вбудованих компонентів. |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли plugin channel потребує легких метаданих конфігурації до завантаження рантайму.

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

| Поле          | Тип                      | Що воно означає                                                                              |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису конфігурації channel. |
| `uiHints`     | `Record<string, object>` | Необов’язкові підписи UI/placeholders/підказки чутливості для цього розділу конфігурації channel. |
| `label`       | `string`                 | Підпис channel, який об’єднується в поверхні picker та inspect, коли метадані рантайму ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь inspect і catalog.                                       |
| `preferOver`  | `string[]`               | Застарілі або менш пріоритетні ідентифікатори plugin, які цей channel має випереджати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш provider plugin із
скорочених ідентифікаторів моделей на кшталт `gpt-5.4` або `claude-sonnet-4.6` до
завантаження рантайму plugin.

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

| Поле            | Тип        | Що воно означає                                                                     |
| --------------- | ---------- | ----------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, які перевіряються через `startsWith` для скорочених ідентифікаторів моделей. |
| `modelPatterns` | `string[]` | Джерела regex, які перевіряються для скорочених ідентифікаторів моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня не рекомендовані. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` під `contracts`; звичайне
завантаження маніфесту більше не розглядає ці поля верхнього рівня як
володіння можливостями.

## Маніфест і package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів auth і підказки UI, які мають існувати до запуску коду plugin            |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для entrypoint, обмежень встановлення, setup або метаданих catalog |

Якщо ви не впевнені, куди належить певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw має знати це до завантаження коду plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів входу або поведінки встановлення npm, помістіть це в `package.json`

### Поля package.json, які впливають на виявлення

Деякі метадані plugin для етапу до запуску рантайму навмисно зберігаються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                         |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує власні entrypoint plugin. Має залишатися всередині каталогу пакета plugin.                                                                                                   |
| `openclaw.runtimeExtensions`                                      | Оголошує entrypoint built JavaScript runtime для встановлених пакетів. Має залишатися всередині каталогу пакета plugin.                                                               |
| `openclaw.setupEntry`                                             | Легка точка входу лише для setup, що використовується під час onboarding, відкладеного запуску channel і discovery статусу channel/SecretRef лише для читання. Має залишатися всередині каталогу пакета plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує built JavaScript setup entrypoint для встановлених пакетів. Має залишатися всередині каталогу пакета plugin.                                                                 |
| `openclaw.channel`                                                | Легкі метадані catalog channel, як-от підписи, шляхи до документації, alias і текст для вибору.                                                                                        |
| `openclaw.channel.configuredState`                                | Легкі метадані перевірки configured-state, які можуть відповісти на питання «чи вже існує setup лише через env?» без завантаження повного рантайму channel.                          |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевірки persisted-auth, які можуть відповісти на питання «чи вже хтось увійшов?» без завантаження повного рантайму channel.                                          |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для вбудованих і зовнішньо опублікованих plugin.                                                                                                      |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                  |
| `openclaw.install.minHostVersion`                                 | Мінімально підтримувана версія хоста OpenClaw із semver-нижньою межею на кшталт `>=2026.3.22`.                                                                                        |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення вбудованого plugin, коли конфігурація невалідна.                                                                             |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє завантажувати поверхні channel лише для setup до повного plugin channel під час запуску.                                                                                     |

`openclaw.install.minHostVersion` застосовується під час встановлення та
завантаження реєстру маніфестів. Невалідні значення відхиляються; новіші, але валідні
значення пропускають plugin на старіших хостах.

Plugin channel мають надавати `openclaw.setupEntry`, коли статус, список channel
або сканування SecretRef мають визначати налаштовані акаунти без завантаження повного
рантайму. Точка входу setup має надавати метадані channel разом із безпечними для setup
адаптерами конфігурації, статусу та секретів; мережеві клієнти, слухачі Gateway і
транспортні рантайми мають залишатися в основній точці входу extension.

Поля runtime entrypoint не скасовують перевірки меж пакета для полів source
entrypoint. Наприклад, `openclaw.runtimeExtensions` не може зробити шлях
`openclaw.extensions`, що виходить за межі, придатним до завантаження.

`openclaw.install.allowInvalidConfigRecovery` навмисно є вузьким. Воно не
робить довільні зламані конфігурації придатними до встановлення. Сьогодні воно лише
дозволяє потокам встановлення відновлюватися після конкретних застарілих збоїв
оновлення вбудованих plugin, наприклад відсутнього шляху до вбудованого plugin або
застарілого запису `channels.<id>` для того самого вбудованого plugin. Непов’язані
помилки конфігурації все одно блокують встановлення й спрямовують операторів до
`openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це метадані пакета для крихітного модуля перевірки:

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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна
легка перевірка auth типу «так/ні» до завантаження повного plugin channel. Цільовий експорт
має бути невеликою функцією, яка лише читає збережений стан; не маршрутизуйте її через
повний barrel рантайму channel.

`openclaw.channel.configuredState` має таку саму форму для легких перевірок configured-state лише через env:

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

Використовуйте це, коли channel може визначити configured-state через env або інші
малі невиконувані в рантаймі джерела. Якщо перевірка потребує повного розв’язання конфігурації
або справжнього рантайму channel, залиште цю логіку в hook plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати ідентифікаторів plugin)

OpenClaw виявляє plugin із кількох коренів (вбудовані, глобальне встановлення, workspace, явно вибрані в конфігурації шляхи). Якщо два виявлення мають спільний `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч із ним.

Пріоритет від найвищого до найнижчого:

1. **Вибраний у конфігурації** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — plugin, що постачаються разом з OpenClaw
3. **Глобальне встановлення** — plugin, установлені в глобальний корінь plugin OpenClaw
4. **Workspace** — plugin, виявлені відносно поточного workspace

Наслідки:

- Розгалужена або застаріла копія вбудованого plugin у workspace не зможе затінити вбудовану збірку.
- Щоб справді перевизначити вбудований plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтеся на виявлення у workspace.
- Відкидання дублікатів логуються, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен plugin повинен постачатися з JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема допустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми проходять валідацію під час читання/запису конфігурації, а не під час рантайму.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки ідентифікатор channel не оголошений
  у маніфесті plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  повинні посилатися на **виявлювані** ідентифікатори plugin. Невідомі ідентифікатори є **помилками**.
- Якщо plugin установлено, але він має зламаний або відсутній маніфест чи схему,
  валідація завершується помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнений**, конфігурація зберігається,
  і в Doctor + логах показується **попередження**.

Повну схему `plugins.*` дивіться в [Configuration reference](/uk/gateway/configuration).

## Примітки

- Маніфест **обов’язковий для власних plugin OpenClaw**, включно з локальними завантаженнями з файлової системи.
- Рантайм усе одно завантажує модуль plugin окремо; маніфест використовується лише для
  виявлення + валідації.
- Власні маніфести парсяться за допомогою JSON5, тому коментарі, кінцеві коми та
  ключі без лапок допускаються, якщо кінцеве значення все ще є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте додавання
  тут власних ключів верхнього рівня.
- `providerAuthEnvVars` — це легкий шлях метаданих для перевірок auth, валідації
  env-marker та подібних поверхонь auth provider, які не повинні запускати рантайм plugin
  лише для перевірки назв env.
- `providerAuthAliases` дозволяє варіантам provider повторно використовувати auth
  env vars, профілі auth, auth на основі конфігурації та варіант onboarding API key
  іншого provider без жорсткого кодування цього зв’язку в ядрі.
- `providerEndpoints` дозволяє plugin provider володіти простими метаданими
  відповідності host/baseUrl endpoint. Використовуйте це лише для класів endpoint, які
  ядро вже підтримує; поведінка рантайму все одно належить plugin.
- `syntheticAuthRefs` — це легкий шлях метаданих для synthetic auth hook, що належать provider
  і мають бути видимими для холодного виявлення моделей до появи реєстру рантайму.
  Вказуйте лише ті посилання, чий runtime provider або backend CLI справді
  реалізує `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` — це легкий шлях метаданих для значень-заповнювачів API key,
  що належать вбудованому plugin, таких як локальні, OAuth або маркери ambient credential.
  Ядро розглядає їх як несекретні для відображення auth і аудитів секретів без
  жорсткого кодування provider-власника.
- `channelEnvVars` — це легкий шлях метаданих для резервного використання shell-env, підказок setup
  та подібних поверхонь channel, які не повинні запускати рантайм plugin лише для
  перевірки назв env. Назви env — це метадані, а не активація самі по собі:
  status, audit, валідація доставки Cron та інші поверхні лише для читання
  усе ще застосовують політику довіри plugin і ефективної активації, перш ніж
  розглядати env var як налаштований channel.
- `providerAuthChoices` — це легкий шлях метаданих для picker варіантів auth,
  визначення `--auth-choice`, мапінгу preferred provider і простої реєстрації
  прапорців CLI для onboarding до завантаження рантайму provider. Для метаданих runtime wizard,
  які потребують коду provider, див.
  [Provider runtime hooks](/uk/plugins/architecture#provider-runtime-hooks).
- Виключні типи plugin вибираються через `plugins.slots.*`.
  - `kind: "memory"` вибирається через `plugins.slots.memory`.
  - `kind: "context-engine"` вибирається через `plugins.slots.contextEngine`
    (типово: вбудований `legacy`).
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо
  plugin їх не потребує.
- Якщо ваш plugin залежить від native module, задокументуйте кроки збірки та всі
  вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Пов’язане

- [Building Plugins](/uk/plugins/building-plugins) — початок роботи з plugin
- [Plugin Architecture](/uk/plugins/architecture) — внутрішня архітектура
- [SDK Overview](/uk/plugins/sdk-overview) — довідник по Plugin SDK
