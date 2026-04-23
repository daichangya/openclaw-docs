---
read_when:
    - Ви створюєте Plugin OpenClaw
    - Вам потрібно постачати schema config Plugin або налагоджувати помилки валідації Plugin
summary: Маніфест Plugin + вимоги до JSON schema (сувора валідація config)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-23T23:02:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf7422a024519d24af426724c430e5b998af947e2632aeb36334d94ac77d0c9
    source_path: plugins/manifest.md
    workflow: 15
---

Ця сторінка стосується лише **власного маніфесту Plugin OpenClaw**.

Сумісні компонування пакетів див. у [Пакетах Plugin](/uk/plugins/bundles).

Сумісні формати пакетів використовують інші файли маніфесту:

- Пакет Codex: `.codex-plugin/plugin.json`
- Пакет Claude: `.claude-plugin/plugin.json` або типове компонування компонентів Claude
  без маніфесту
- Пакет Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці компонування пакетів, але вони не проходять валідацію
за schema `openclaw.plugin.json`, описаною тут.

Для сумісних пакетів OpenClaw наразі читає метадані пакета разом із оголошеними
коренями skill, коренями команд Claude, типовими значеннями `settings.json` пакета Claude,
типовими значеннями Claude bundle LSP і підтримуваними наборами hook, коли компонування
відповідає очікуванням runtime OpenClaw.

Кожен власний Plugin OpenClaw **повинен** постачатися з файлом `openclaw.plugin.json` у
**корені Plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду Plugin**. Відсутні або некоректні маніфести вважаються
помилками Plugin і блокують валідацію config.

Повний посібник по системі Plugin див. у [Plugins](/uk/tools/plugin).
Для власної моделі можливостей і поточних рекомендацій щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **до завантаження коду
вашого Plugin**. Усе нижче має бути достатньо легким для перевірки без запуску
runtime Plugin.

**Використовуйте його для:**

- ідентичності Plugin, валідації config і підказок UI для config
- метаданих auth, onboarding і setup (alias, auto-enable, env vars провайдера, варіанти auth)
- підказок активації для поверхонь control-plane
- скороченого володіння model-family
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які спільний хост `openclaw qa` може перевіряти
- метаданих config, специфічних для каналу, які об’єднуються в catalog і поверхні валідації

**Не використовуйте його для:** реєстрації поведінки runtime, оголошення
code entrypoints або метаданих встановлення npm. Вони належать вашому коду Plugin і `package.json`.

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

| Поле                                 | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                                                  |
| ------------------------------------ | ----------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний id Plugin. Саме цей id використовується в `plugins.entries.<id>`.                                                                                                                                                    |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для config цього Plugin.                                                                                                                                                                                   |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований Plugin як увімкнений типово. Пропустіть це поле або задайте будь-яке значення, відмінне від `true`, щоб Plugin типово залишався вимкненим.                                                                |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id Plugin.                                                                                                                                                                |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Id провайдерів, які мають автоматично вмикати цей Plugin, коли auth, config або посилання на модель згадують їх.                                                                                                              |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип Plugin, який використовується в `plugins.slots.*`.                                                                                                                                                    |
| `channels`                           | Ні          | `string[]`                       | Id каналів, якими володіє цей Plugin. Використовується для виявлення та валідації config.                                                                                                                                      |
| `providers`                          | Ні          | `string[]`                       | Id провайдерів, якими володіє цей Plugin.                                                                                                                                                                                        |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані model-family, якими володіє маніфест і які використовуються для автозавантаження Plugin до запуску runtime.                                                                                                |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані host/baseUrl endpoint, якими володіє маніфест, для маршрутів провайдера, які ядро має класифікувати до завантаження runtime провайдера.                                                                              |
| `cliBackends`                        | Ні          | `string[]`                       | Id backend CLI, якими володіє цей Plugin. Використовується для автоактивації під час запуску на основі явних посилань у config.                                                                                               |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на провайдер або backend CLI, для яких хук synthetic auth, що належить Plugin, має перевірятися під час cold model discovery до завантаження runtime.                                                               |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API key, якими володіє вбудований Plugin і які позначають несекретний локальний стан облікових даних, OAuth або ambient credentials.                                                                     |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, якими володіє цей Plugin і які мають видавати діагностику config і CLI з урахуванням Plugin до завантаження runtime.                                                                                            |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Недорогі метадані env для auth провайдера, які OpenClaw може перевірити без завантаження коду Plugin.                                                                                                                         |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Id провайдерів, які мають повторно використовувати інший id провайдера для пошуку auth, наприклад coding-провайдер, що використовує спільний API key і auth profiles базового провайдера.                                    |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Недорогі метадані env для каналу, які OpenClaw може перевірити без завантаження коду Plugin. Використовуйте це для налаштування каналів через env або поверхонь auth, які мають бачити універсальні допоміжні засоби startup/config. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Недорогі метадані варіантів auth для onboarding picker, визначення preferred-provider і простої прив’язки прапорців CLI.                                                                                                      |
| `activation`                         | Ні          | `object`                         | Недорогі підказки активації для завантаження, що запускається провайдером, командою, каналом, маршрутом і можливостями. Лише метадані; фактичною поведінкою все одно володіє runtime Plugin.                                  |
| `setup`                              | Ні          | `object`                         | Недорогі дескриптори setup/onboarding, які поверхні виявлення та setup можуть перевіряти без завантаження runtime Plugin.                                                                                                     |
| `qaRunners`                          | Ні          | `object[]`                       | Недорогі дескриптори QA runner, які використовує спільний хост `openclaw qa` до завантаження runtime Plugin.                                                                                                                  |
| `contracts`                          | Ні          | `object`                         | Статичний знімок можливостей вбудованого пакета для зовнішніх хуків auth, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння інструментами. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Недорогі типові значення media-understanding для id провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                        |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані config каналу, якими володіє маніфест і які об’єднуються в поверхні виявлення та валідації до завантаження runtime.                                                                                                  |
| `skills`                             | Ні          | `string[]`                       | Каталоги skill для завантаження, відносно кореня Plugin.                                                                                                                                                                        |
| `name`                               | Ні          | `string`                         | Зрозуміла для людини назва Plugin.                                                                                                                                                                                               |
| `description`                        | Ні          | `string`                         | Короткий опис, який показується на поверхнях Plugin.                                                                                                                                                                             |
| `version`                            | Ні          | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                      |
| `uiHints`                            | Ні          | `Record<string, object>`         | Мітки UI, placeholders і підказки щодо чутливості для полів config.                                                                                                                                                             |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант onboarding або auth.
OpenClaw читає це до завантаження runtime провайдера.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                         |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Id провайдера, якому належить цей варіант.                                                              |
| `method`              | Так         | `string`                                        | Id методу auth, до якого треба маршрутизувати.                                                          |
| `choiceId`            | Так         | `string`                                        | Стабільний id варіанта auth, який використовується в onboarding і потоках CLI.                          |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо пропущено, OpenClaw використовує `choiceId` як запасний варіант.           |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для picker.                                                                   |
| `assistantPriority`   | Ні          | `number`                                        | Нижчі значення сортуються раніше в інтерактивних picker, керованих assistant.                          |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант із picker assistant, але все одно дозволяє ручний вибір через CLI.                    |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі id варіантів, які мають перенаправляти користувачів до цього нового варіанта.                |
| `groupId`             | Ні          | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                            |
| `groupLabel`          | Ні          | `string`                                        | Мітка для користувача для цієї групи.                                                                   |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                    |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків auth з одним прапорцем.                                  |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                  |
| `cliOption`           | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                     |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                              |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях onboarding має з’являтися цей варіант. Якщо пропущено, типово використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли Plugin володіє ім’ям runtime-команди, яке користувачі можуть
помилково вказати в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
використовує ці метадані для діагностики без імпорту коду runtime Plugin.

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
| `name`       | Так         | `string`          | Ім’я команди, яка належить цьому Plugin.                                   |
| `kind`       | Ні          | `"runtime-slash"` | Позначає alias як slash-команду чату, а не як кореневу команду CLI.        |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку можна запропонувати для операцій CLI, якщо вона існує. |

## Довідник `activation`

Використовуйте `activation`, коли Plugin може недорого оголосити, які події control-plane
мають активувати його пізніше.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли Plugin додає один або кілька transport runner під
спільним коренем `openclaw qa`. Зберігайте ці метадані дешевими й статичними; фактичною поведінкою
runtime все одно володіє Plugin через полегшену поверхню `runtime-api.ts`, яка експортує
`qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Запустити live QA lane Matrix на базі Docker проти одноразового homeserver"
    }
  ]
}
```

| Поле          | Обов’язкове | Тип      | Що воно означає                                                         |
| ------------- | ----------- | -------- | ----------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.           |
| `description` | Ні          | `string` | Запасний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

Цей блок містить лише метадані. Він не реєструє поведінку runtime і не
замінює `register(...)`, `setupEntry` або інші entrypoints runtime/Plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням Plugin, тож
відсутність метаданих активації зазвичай лише впливає на продуктивність; це не повинно
змінювати коректність, поки ще існують застарілі запасні механізми володіння маніфестом.

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

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                       |
| ---------------- | ----------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| `onProviders`    | Ні          | `string[]`                                           | Id провайдерів, які мають активувати цей Plugin за запитом.           |
| `onCommands`     | Ні          | `string[]`                                           | Id команд, які мають активувати цей Plugin.                           |
| `onChannels`     | Ні          | `string[]`                                           | Id каналів, які мають активувати цей Plugin.                          |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають активувати цей Plugin.                      |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Широкі підказки можливостей, які використовуються в плануванні активації control-plane. |

Поточні live-споживачі:

- планування CLI, запущене командою, використовує як запасний варіант застарілі
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/channel, запущене каналом, використовує як запасний варіант застаріле володіння
  `channels[]`, якщо відсутні явні метадані активації каналу
- планування setup/runtime, запущене провайдером, використовує як запасний варіант застаріле
  володіння `providers[]` і верхньорівневі `cliBackends[]`, якщо відсутні явні метадані
  активації провайдера

## Довідник `setup`

Використовуйте `setup`, коли поверхням setup і onboarding потрібні дешеві метадані Plugin
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

Верхньорівневий `cliBackends` залишається коректним і далі описує backend CLI inference.
`setup.cliBackends` — це поверхня дескрипторів, специфічна для setup, для
потоків control-plane/setup, які мають залишатися лише метаданими.

Якщо вони присутні, `setup.providers` і `setup.cliBackends` є бажаною
поверхнею пошуку descriptor-first для виявлення setup. Якщо дескриптор лише
звужує кандидатний Plugin, а setup усе ще потребує багатших хуків runtime на етапі setup,
задайте `requiresRuntime: true` і залиште `setup-api` як
запасний шлях виконання.

Оскільки пошук setup може виконувати код `setup-api`, що належить Plugin, нормалізовані
значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед
виявлених Plugin. За неоднозначного володіння застосовується fail-closed, а не вибір
переможця за порядком виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                      |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Так         | `string`   | Id провайдера, який відкривається під час setup або onboarding. Нормалізовані id мають бути глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Id методів setup/auth, які цей провайдер підтримує без завантаження повного runtime. |
| `envVars`     | Ні          | `string[]` | Env vars, які універсальні поверхні setup/status можуть перевіряти до завантаження runtime Plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                     |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup провайдера, які відкриваються під час setup і onboarding.                        |
| `cliBackends`      | Ні          | `string[]` | Id backend для часу setup, які використовуються для пошуку descriptor-first. Нормалізовані id мають бути глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Id міграцій config, якими володіє поверхня setup цього Plugin.                                     |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup і далі виконання `setup-api` після пошуку за дескриптором.                       |

## Довідник `uiHints`

`uiHints` — це мапа від імен полів config до невеликих підказок для рендерингу.

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
| `label`       | `string`   | Мітка поля для користувача.             |
| `help`        | `string`   | Короткий допоміжний текст.              |
| `tags`        | `string[]` | Необов’язкові теги UI.                  |
| `advanced`    | `boolean`  | Позначає поле як розширене.             |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.  |
| `placeholder` | `string`   | Текст placeholder для полів форми.      |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
прочитати без імпорту runtime Plugin.

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

Кожен список є необов’язковим:

| Поле                             | Тип        | Що воно означає                                                       |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Id вбудованого runtime, для яких вбудований Plugin може реєструвати factory. |
| `externalAuthProviders`          | `string[]` | Id провайдерів, чий зовнішній хук auth profile належить цьому Plugin. |
| `speechProviders`                | `string[]` | Id провайдерів speech, якими володіє цей Plugin.                      |
| `realtimeTranscriptionProviders` | `string[]` | Id провайдерів realtime-transcription, якими володіє цей Plugin.      |
| `realtimeVoiceProviders`         | `string[]` | Id провайдерів realtime-voice, якими володіє цей Plugin.              |
| `mediaUnderstandingProviders`    | `string[]` | Id провайдерів media-understanding, якими володіє цей Plugin.         |
| `imageGenerationProviders`       | `string[]` | Id провайдерів image-generation, якими володіє цей Plugin.            |
| `videoGenerationProviders`       | `string[]` | Id провайдерів video-generation, якими володіє цей Plugin.            |
| `webFetchProviders`              | `string[]` | Id провайдерів web-fetch, якими володіє цей Plugin.                   |
| `webSearchProviders`             | `string[]` | Id провайдерів web-search, якими володіє цей Plugin.                  |
| `tools`                          | `string[]` | Імена інструментів агента, якими володіє цей Plugin для перевірок вбудованих контрактів. |

Plugin провайдера, які реалізують `resolveExternalAuthProfiles`, мають оголошувати
`contracts.externalAuthProviders`. Plugin без цього оголошення все ще працюють
через застарілий сумісний запасний механізм, але він повільніший і
буде видалений після завершення вікна міграції.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли провайдер media-understanding має
типові моделі, пріоритет запасного варіанта auto-auth або власну підтримку документів, які
потрібні універсальним допоміжним засобам ядра до завантаження runtime. Ключі також мають бути оголошені в
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

| Поле                   | Тип                                 | Що воно означає                                                           |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Можливості медіа, які надає цей провайдер.                                |
| `defaultModels`        | `Record<string, string>`            | Типові значення відповідності можливостей моделям, які використовуються, коли в config не вказано модель. |
| `autoPriority`         | `Record<string, number>`            | Нижчі числа сортуються раніше для автоматичного запасного вибору провайдера на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Власні вхідні дані документів, які підтримує провайдер.                   |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли Plugin каналу потребує дешевих метаданих config до
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
      "description": "Підключення до homeserver Matrix",
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Кожен запис каналу може містити:

| Поле          | Тип                      | Що воно означає                                                                                 |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису config каналу.     |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/placeholders/підказки чутливості для цього розділу config каналу.       |
| `label`       | `string`                 | Мітка каналу, яка об’єднується в picker і поверхні інспекції, коли метадані runtime ще не готові. |
| `description` | `string`                 | Короткий опис каналу для поверхонь інспекції та catalog.                                        |
| `preferOver`  | `string[]`               | Id застарілих або нижчопріоритетних Plugin, які цей канал має випереджати на поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має визначати ваш Plugin провайдера з
коротких id моделей на кшталт `gpt-5.5` або `claude-sonnet-4.6` до завантаження runtime
Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий пріоритет:

- явні посилання `provider/model` використовують метадані маніфесту `providers`, якими володіє Plugin
- `modelPatterns` мають пріоритет над `modelPrefixes`
- якщо збігаються один невбудований Plugin і один вбудований Plugin, перемагає невбудований
  Plugin
- решта неоднозначностей ігнорується, доки користувач або config не вкаже провайдера

Поля:

| Поле            | Тип        | Що воно означає                                                              |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, які зіставляються через `startsWith` із короткими id моделей.      |
| `modelPatterns` | `string[]` | Джерела regex, які зіставляються з короткими id моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня застаріли. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` до `contracts`; звичайне
завантаження маніфесту більше не розглядає ці поля верхнього рівня як
володіння можливостями.

## Маніфест проти package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | Виявлення, валідація config, метадані варіантів auth і підказки UI, які мають існувати до запуску коду Plugin               |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для entrypoints, обмежень встановлення, setup або метаданих catalog |

Якщо ви не впевнені, куди має належати певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw повинен знати це до завантаження коду Plugin, розміщуйте це в `openclaw.plugin.json`
- якщо це стосується пакування, entry files або поведінки встановлення npm, розміщуйте це в `package.json`

### Поля package.json, які впливають на виявлення

Деякі метадані Plugin до запуску runtime навмисно розміщуються в `package.json` у
блоці `openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                     |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує власні entrypoints Plugin. Має залишатися в межах каталогу пакета Plugin.                                                                                                 |
| `openclaw.runtimeExtensions`                                      | Оголошує зібрані entrypoints JavaScript runtime для встановлених пакетів. Має залишатися в межах каталогу пакета Plugin.                                                          |
| `openclaw.setupEntry`                                             | Полегшений entrypoint лише для setup, який використовується під час onboarding, відкладеного запуску каналу та виявлення status/SecretRef каналу в режимі лише читання. Має залишатися в межах каталогу пакета Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує зібраний entrypoint JavaScript setup для встановлених пакетів. Має залишатися в межах каталогу пакета Plugin.                                                            |
| `openclaw.channel`                                                | Недорогі метадані catalog каналу, такі як мітки, шляхи до docs, alias і текст для вибору.                                                                                          |
| `openclaw.channel.configuredState`                                | Полегшені метадані перевірки configured-state, які можуть відповісти на питання «чи вже існує налаштування лише через env?» без завантаження повного runtime каналу.              |
| `openclaw.channel.persistedAuthState`                             | Полегшені метадані перевірки persisted-auth, які можуть відповісти на питання «чи вже є хоч щось авторизоване?» без завантаження повного runtime каналу.                           |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки для встановлення/оновлення вбудованих і зовнішньо опублікованих Plugin.                                                                                                    |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із нижньою межею semver, наприклад `>=2026.3.22`.                                                                                    |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок integrity dist npm, наприклад `sha512-...`; потоки встановлення й оновлення звіряють із ним отриманий артефакт.                                                  |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення вбудованого Plugin, коли config невалідний.                                                                               |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням каналу лише для setup завантажуватися до повного Plugin каналу під час startup.                                                                                 |

Метадані маніфесту визначають, які варіанти provider/channel/setup з’являються в
onboarding до завантаження runtime. `package.json#openclaw.install` повідомляє
onboarding, як отримати або ввімкнути цей Plugin, коли користувач вибирає один із цих
варіантів. Не переміщуйте підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` примусово перевіряється під час встановлення та
завантаження registry маніфесту. Некоректні значення відхиляються; новіші, але коректні значення пропускають
Plugin на старіших хостах.

Точне закріплення версії npm уже живе в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Поєднуйте це з
`expectedIntegrity`, якщо хочете, щоб потоки оновлення переходили в fail-closed, коли отриманий
артефакт npm більше не збігається із закріпленим release. Інтерактивний onboarding
пропонує надійні registry npm spec, включно з просто назвами пакетів і dist-tag.
Коли присутній `expectedIntegrity`, потоки встановлення/оновлення примусово його перевіряють; коли його
пропущено, дозвіл registry записується без закріплення integrity.

Plugin каналів мають надавати `openclaw.setupEntry`, коли status, список каналів
або сканування SecretRef повинні визначати налаштовані облікові записи без завантаження повного
runtime. Entry setup має відкривати метадані каналу разом із безпечними для setup адаптерами config,
status і secrets; мережеві клієнти, слухачі gateway і transport runtime
мають залишатися в основному entrypoint extension.

Поля entrypoint runtime не перевизначають перевірки меж пакета для полів
source entrypoint. Наприклад, `openclaw.runtimeExtensions` не може зробити
завантажуваним шлях `openclaw.extensions`, який виходить за межі пакета.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він
не робить довільно зламані config придатними до встановлення. Сьогодні він дозволяє лише потокам встановлення
відновлюватися після конкретних застарілих збоїв оновлення вбудованих Plugin, таких як
відсутній шлях вбудованого Plugin або застарілий запис `channels.<id>` для того самого
вбудованого Plugin. Не пов’язані помилки config усе одно блокують встановлення й направляють операторів
до `openclaw doctor --fix`.

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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна дешева перевірка auth
у форматі так/ні до завантаження повного Plugin каналу. Цільовий export має бути невеликою
функцією, яка читає лише збережений стан; не маршрутизуйте його через повний
barrel runtime каналу.

`openclaw.channel.configuredState` має ту саму форму для дешевих перевірок
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

Використовуйте це, коли канал може визначити configured-state з env або інших малих
невиконавчих вхідних даних. Якщо перевірка потребує повного розв’язання config або реального
runtime каналу, залиште цю логіку в хуку Plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати id Plugin)

OpenClaw виявляє Plugin з кількох коренів (вбудовані, глобально встановлені, workspace, явно вибрані в config шляхи). Якщо два виявлені Plugin мають той самий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються, а не завантажуються поруч.

Пріоритет, від найвищого до найнижчого:

1. **Вибраний у config** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — Plugin, які постачаються разом з OpenClaw
3. **Глобально встановлений** — Plugin, установлені в глобальний корінь Plugin OpenClaw
4. **Workspace** — Plugin, виявлені відносно поточного workspace

Наслідки:

- Розгалужена або застаріла копія вбудованого Plugin, що лежить у workspace, не зможе затінити вбудовану збірку.
- Щоб справді перевизначити вбудований Plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладався на виявлення у workspace.
- Відкидання дублікатів логуються, щоб Doctor і діагностика startup могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен Plugin повинен постачатися з JSON Schema**, навіть якщо він не приймає config.
- Порожня schema допустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Schema проходять валідацію під час читання/запису config, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки id каналу не оголошений у
  маніфесті Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **виявлювані** id Plugin. Невідомі id є **помилками**.
- Якщо Plugin установлено, але він має зламаний або відсутній маніфест чи schema,
  валідація не проходить, а Doctor повідомляє про помилку Plugin.
- Якщо config Plugin існує, але сам Plugin **вимкнено**, config зберігається і
  в Doctor + журналах показується **попередження**.

Повну schema `plugins.*` див. у [Довіднику конфігурації](/uk/gateway/configuration).

## Примітки

- Маніфест **обов’язковий для власних Plugin OpenClaw**, зокрема й для локального завантаження з файлової системи. Runtime усе одно окремо завантажує модуль Plugin; маніфест використовується лише для виявлення + валідації.
- Власні маніфести аналізуються як JSON5, тому коментарі, кінцеві коми й ключі без лапок допускаються, якщо фінальне значення все одно залишається об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте власних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна повністю пропускати, якщо Plugin їх не потребує.
- Ексклюзивні типи Plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Метадані env var (`providerAuthEnvVars`, `channelEnvVars`) є лише декларативними. Status, audit, валідація доставки Cron та інші поверхні лише для читання все одно застосовують політику довіри до Plugin і ефективну політику активації, перш ніж вважати env var налаштованою.
- Для метаданих runtime wizard, які потребують коду провайдера, див. [Хуки runtime провайдера](/uk/plugins/architecture#provider-runtime-hooks).
- Якщо ваш Plugin залежить від власних модулів, задокументуйте кроки збірки й усі вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення Plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з Plugin.
  </Card>
  <Card title="Архітектура Plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура й модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник SDK Plugin і subpath imports.
  </Card>
</CardGroup>
