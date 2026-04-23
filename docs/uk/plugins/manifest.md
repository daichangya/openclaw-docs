---
read_when:
    - Ви створюєте plugin для OpenClaw
    - Вам потрібно постачати схему конфігурації plugin або налагодити помилки валідації plugin
summary: Вимоги до маніфесту Plugin + JSON schema (сувора валідація конфігурації)
title: маніфест Plugin
x-i18n:
    generated_at: "2026-04-23T16:56:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: e9e7bca47b076cc49080bd6921ef9d295c840e9a19c5271dbfea83d9882ea404
    source_path: plugins/manifest.md
    workflow: 15
---

# Маніфест Plugin (`openclaw.plugin.json`)

Ця сторінка стосується лише **нативного маніфесту plugin OpenClaw**.

Щоб дізнатися про сумісні макети bundle, див. [Plugin bundles](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw також автоматично визначає ці макети bundle, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі читає метадані bundle разом із оголошеними
коренями skills, коренями команд Claude, типовими значеннями `settings.json` для bundle Claude,
типовими значеннями LSP для bundle Claude та підтримуваними наборами hook, якщо макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен нативний plugin OpenClaw **повинен** постачатися з файлом `openclaw.plugin.json` у
**корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду plugin**. Відсутні або невалідні маніфести вважаються
помилками plugin і блокують валідацію конфігурації.

Див. повний посібник із системи plugin: [Plugins](/uk/tools/plugin).
Щодо нативної моделі можливостей і поточних рекомендацій із зовнішньої сумісності:
[Capability model](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **до завантаження коду
вашого plugin**. Усе нижче має бути достатньо легким для перевірки без запуску
середовища виконання plugin.

**Використовуйте його для:**

- ідентичності plugin, валідації конфігурації та підказок UI конфігурації
- метаданих auth, онбордингу та налаштування (псевдонім, автоувімкнення, env vars провайдера, варіанти auth)
- підказок активації для поверхонь control-plane
- скороченого володіння сімействами моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації, специфічних для channel, які об’єднуються в поверхні каталогу та валідації

**Не використовуйте його для:** реєстрації поведінки середовища виконання, оголошення
точок входу коду або метаданих встановлення npm. Вони мають бути у коді вашого plugin і в `package.json`.

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
  "description": "Плагін провайдера OpenRouter",
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
      "choiceLabel": "Ключ API OpenRouter",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "Ключ API OpenRouter",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "Ключ API",
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

| Поле                                 | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                                                   |
| ------------------------------------ | ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний id plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                                                     |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                                              |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований plugin як увімкнений за замовчуванням. Не вказуйте це поле або задайте будь-яке значення, відмінне від `true`, щоб plugin залишався вимкненим за замовчуванням.                                             |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id plugin.                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Id провайдерів, які мають автоматично вмикати цей plugin, коли auth, конфігурація або посилання на моделі згадують їх.                                                                                                          |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип plugin, який використовується `plugins.slots.*`.                                                                                                                                                        |
| `channels`                           | Ні          | `string[]`                       | Id channel, якими володіє цей plugin. Використовується для виявлення та валідації конфігурації.                                                                                                                                  |
| `providers`                          | Ні          | `string[]`                       | Id провайдерів, якими володіє цей plugin.                                                                                                                                                                                         |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейств моделей, якими володіє маніфест, що використовуються для автоматичного завантаження plugin до запуску середовища виконання.                                                                          |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані хостів endpoint/baseUrl для маршрутів провайдера, якими володіє маніфест, які ядро має класифікувати до завантаження середовища виконання провайдера.                                                                  |
| `cliBackends`                        | Ні          | `string[]`                       | Id backend CLI inference, якими володіє цей plugin. Використовується для автоматичної активації під час запуску з явних посилань у конфігурації.                                                                                 |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на провайдера або backend CLI, для яких під час холодного виявлення моделей до завантаження середовища виконання потрібно перевіряти синтетичний hook auth, що належить plugin.                                       |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі ключів API, що належать вбудованому plugin і представляють несекретний локальний стан, OAuth або стан облікових даних середовища.                                                                            |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, якими володіє цей plugin і які мають створювати діагностику конфігурації та CLI з урахуванням plugin до завантаження середовища виконання.                                                                         |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Легкі метадані env для auth провайдера, які OpenClaw може перевіряти без завантаження коду plugin.                                                                                                                               |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Id провайдерів, які мають повторно використовувати id іншого провайдера для пошуку auth, наприклад провайдер для кодування, що використовує спільний ключ API базового провайдера та профілі auth.                             |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Легкі метадані env для channel, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для налаштування channel через env або поверхонь auth, які мають бачити загальні допоміжні засоби запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Легкі метадані варіантів auth для селекторів онбордингу, визначення пріоритетного провайдера та простого зв’язування прапорців CLI.                                                                                              |
| `activation`                         | Ні          | `object`                         | Легкі підказки активації для завантаження, що ініціюється провайдером, командою, channel, маршрутом і можливостями. Лише метадані; фактичною поведінкою як і раніше володіє середовище виконання plugin.                       |
| `setup`                              | Ні          | `object`                         | Легкі дескриптори налаштування/онбордингу, які поверхні виявлення та налаштування можуть перевіряти без завантаження середовища виконання plugin.                                                                                |
| `qaRunners`                          | Ні          | `object[]`                       | Легкі дескриптори QA runner, які спільний хост `openclaw qa` використовує до завантаження середовища виконання plugin.                                                                                                           |
| `contracts`                          | Ні          | `object`                         | Статичний знімок можливостей вбудованого plugin для зовнішніх hook auth, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння tools. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Легкі типові значення media-understanding для id провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                              |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації channel, якими володіє маніфест і які об’єднуються в поверхні виявлення та валідації до завантаження середовища виконання.                                                                                 |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня plugin.                                                                                                                                                                         |
| `name`                               | Ні          | `string`                         | Людинозрозуміла назва plugin.                                                                                                                                                                                                     |
| `description`                        | Ні          | `string`                         | Короткий опис, що відображається в поверхнях plugin.                                                                                                                                                                              |
| `version`                            | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                                       |
| `uiHints`                            | Ні          | `Record<string, object>`         | Мітки UI, placeholders і підказки щодо чутливості для полів конфігурації.                                                                                                                                                         |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або auth.
OpenClaw читає це до завантаження середовища виконання провайдера.

| Поле                 | Обов’язкове | Тип                                             | Що воно означає                                                                                       |
| -------------------- | ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `provider`           | Так         | `string`                                        | Id провайдера, якому належить цей варіант.                                                            |
| `method`             | Так         | `string`                                        | Id методу auth, до якого слід маршрутизувати.                                                         |
| `choiceId`           | Так         | `string`                                        | Стабільний id варіанта auth, який використовується потоками онбордингу та CLI.                        |
| `choiceLabel`        | Ні          | `string`                                        | Мітка для користувача. Якщо не вказано, OpenClaw використовує `choiceId` як запасний варіант.        |
| `choiceHint`         | Ні          | `string`                                        | Короткий допоміжний текст для селектора.                                                              |
| `assistantPriority`  | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних селекторах, керованих асистентом.                   |
| `assistantVisibility`| Ні          | `"visible"` \| `"manual-only"`                  | Приховує цей варіант від селекторів асистента, але все ще дозволяє ручний вибір через CLI.           |
| `deprecatedChoiceIds`| Ні          | `string[]`                                      | Застарілі id варіантів, які мають перенаправляти користувачів до цього варіанта-замінника.           |
| `groupId`            | Ні          | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                          |
| `groupLabel`         | Ні          | `string`                                        | Мітка цієї групи для користувача.                                                                     |
| `groupHint`          | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                  |
| `optionKey`          | Ні          | `string`                                        | Внутрішній ключ опції для простих потоків auth з одним прапорцем.                                    |
| `cliFlag`            | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                 |
| `cliOption`          | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                       |
| `cliDescription`     | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                            |
| `onboardingScopes`   | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з’являтися цей варіант. Якщо не вказано, типовим є `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє назвою команди середовища виконання, яку користувачі можуть
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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                           |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------- |
| `name`       | Так         | `string`          | Назва команди, яка належить цьому plugin.                                 |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не кореневу команду CLI.      |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід пропонувати для операцій CLI, якщо така існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може дешево оголосити, які події control-plane
мають активувати його пізніше.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або більше transport runner під спільним
коренем `openclaw qa`. Зберігайте ці метадані легкими та статичними; фактичною реєстрацією CLI як і раніше
володіє середовище виконання plugin через легку поверхню `runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Запустити Docker-backed live QA lane Matrix на disposable homeserver"
    }
  ]
}
```

| Поле          | Обов’язкове | Тип      | Що воно означає                                                     |
| ------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.       |
| `description` | Ні          | `string` | Запасний текст довідки, який використовується, коли спільному хосту потрібна команда-заглушка. |

Цей блок — лише метадані. Він не реєструє поведінку середовища виконання і
не замінює `register(...)`, `setupEntry` або інші точки входу середовища виконання/plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням plugin, тож
відсутність метаданих активації зазвичай впливає лише на продуктивність; це не повинно
змінювати коректність, поки ще існують запасні варіанти legacy ownership у маніфесті.

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

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                  |
| ---------------- | ----------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| `onProviders`    | Ні          | `string[]`                                           | Id провайдерів, які мають активувати цей plugin за запитом.      |
| `onCommands`     | Ні          | `string[]`                                           | Id команд, які мають активувати цей plugin.                      |
| `onChannels`     | Ні          | `string[]`                                           | Id channel, які мають активувати цей plugin.                     |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають активувати цей plugin.                 |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки можливостей, що використовуються в плануванні активації control-plane. |

Поточні активні споживачі:

- планування CLI, ініційоване командою, повертається до legacy
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/channel, ініційоване channel, повертається до legacy володіння
  `channels[]`, коли явні метадані активації channel відсутні
- планування setup/runtime, ініційоване провайдером, повертається до legacy
  володіння `providers[]` і `cliBackends[]` верхнього рівня, коли явні метадані
  активації провайдера відсутні

## Довідник `setup`

Використовуйте `setup`, коли поверхням setup та онбордингу потрібні легкі метадані plugin
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

`cliBackends` верхнього рівня залишається валідним і надалі описує
backend CLI inference. `setup.cliBackends` — це поверхня дескрипторів, специфічна для setup,
для потоків control-plane/setup, яка має залишатися лише метаданими.

За наявності `setup.providers` і `setup.cliBackends` є пріоритетною
поверхнею пошуку на основі дескрипторів для виявлення setup. Якщо дескриптор лише
звужує кандидатний plugin, а setup все ще потребує багатших hook середовища виконання під час setup,
установіть `requiresRuntime: true` і збережіть `setup-api` як
запасний шлях виконання.

Оскільки пошук setup може виконувати код `setup-api`, що належить plugin,
нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними
серед виявлених plugin. Неоднозначне володіння призводить до закритої відмови замість вибору
переможця за порядком виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                     |
| ------------- | ----------- | ---------- | ----------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | Id провайдера, що надається під час setup або онбордингу. Зберігайте нормалізовані id глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Id методів setup/auth, які цей провайдер підтримує без завантаження повного середовища виконання. |
| `envVars`     | Ні          | `string[]` | Env vars, які загальні поверхні setup/status можуть перевіряти до завантаження середовища виконання plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                      |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup провайдера, що надаються під час setup та онбордингу.                              |
| `cliBackends`      | Ні          | `string[]` | Id backend під час setup, які використовуються для пошуку setup на основі дескрипторів. Зберігайте нормалізовані id глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Id міграцій конфігурації, якими володіє поверхня setup цього plugin.                                 |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескриптором.                                |

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

Кожна підказка поля може містити:

| Поле          | Тип        | Що воно означає                           |
| ------------- | ---------- | ----------------------------------------- |
| `label`       | `string`   | Мітка поля для користувача.               |
| `help`        | `string`   | Короткий допоміжний текст.                |
| `tags`        | `string[]` | Необов’язкові теги UI.                    |
| `advanced`    | `boolean`  | Позначає поле як розширене.               |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.    |
| `placeholder` | `string`   | Текст placeholder для полів форми.        |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
прочитати без імпорту середовища виконання plugin.

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

| Поле                             | Тип        | Що воно означає                                                   |
| -------------------------------- | ---------- | ----------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Id вбудованого середовища виконання, для яких вбудований plugin може реєструвати factories. |
| `externalAuthProviders`          | `string[]` | Id провайдерів, hook зовнішнього профілю auth яких належить цьому plugin. |
| `speechProviders`                | `string[]` | Id провайдерів speech, якими володіє цей plugin.                  |
| `realtimeTranscriptionProviders` | `string[]` | Id провайдерів realtime-transcription, якими володіє цей plugin.  |
| `realtimeVoiceProviders`         | `string[]` | Id провайдерів realtime-voice, якими володіє цей plugin.          |
| `mediaUnderstandingProviders`    | `string[]` | Id провайдерів media-understanding, якими володіє цей plugin.     |
| `imageGenerationProviders`       | `string[]` | Id провайдерів image-generation, якими володіє цей plugin.        |
| `videoGenerationProviders`       | `string[]` | Id провайдерів video-generation, якими володіє цей plugin.        |
| `webFetchProviders`              | `string[]` | Id провайдерів web-fetch, якими володіє цей plugin.               |
| `webSearchProviders`             | `string[]` | Id провайдерів web-search, якими володіє цей plugin.              |
| `tools`                          | `string[]` | Назви tools агента, якими володіє цей plugin для перевірок контрактів вбудованих plugin. |

Plugin провайдера, які реалізують `resolveExternalAuthProfiles`, мають оголошувати
`contracts.externalAuthProviders`. Plugin без цього оголошення все ще працюють
через застарілий запасний механізм сумісності, але він повільніший і
буде видалений після вікна міграції.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли провайдер media-understanding має
типові моделі, пріоритет запасного auto-auth або нативну підтримку документів, які
загальним допоміжним засобам ядра потрібні до завантаження середовища виконання. Ключі також мають бути оголошені в
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

| Поле                   | Тип                                 | Що воно означає                                                              |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей провайдер.                                    |
| `defaultModels`        | `Record<string, string>`            | Типові відповідності можливість-модель, які використовуються, коли конфігурація не задає модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного запасного вибору провайдера на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні входи документів, які підтримує провайдер.                           |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли plugin channel потребує легких метаданих конфігурації
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

Кожен запис channel може містити:

| Поле          | Тип                      | Що воно означає                                                                 |
| ------------- | ------------------------ | -------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації channel. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/placeholders/підказки чутливості для цього розділу конфігурації channel. |
| `label`       | `string`                 | Мітка channel, що об’єднується в поверхні вибору та перевірки, коли метадані середовища виконання ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь перевірки та каталогу.                      |
| `preferOver`  | `string[]`               | Id застарілих plugin або plugin з нижчим пріоритетом, які цей channel має випереджати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш plugin провайдера з
скорочених id моделей, таких як `gpt-5.4` або `claude-sonnet-4.6`, до завантаження середовища виконання plugin.

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
- `modelPatterns` мають вищий пріоритет, ніж `modelPrefixes`
- якщо збігаються один невбудований plugin і один вбудований plugin, перемагає невбудований
  plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не вкажуть провайдера

Поля:

| Поле            | Тип        | Що воно означає                                                              |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими id моделей.     |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими id моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня застаріли. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` під `contracts`; звичайне
завантаження маніфесту більше не розглядає ці поля верхнього рівня як
володіння можливостями.

## Маніфест і `package.json`

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів auth і підказки UI, які мають існувати до запуску коду plugin           |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, який використовується для точок входу, обмежень встановлення, setup або метаданих каталогу |

Якщо ви не впевнені, куди має належати певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw має знати це до завантаження коду plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів точок входу або поведінки встановлення npm, помістіть це в `package.json`

### Поля `package.json`, які впливають на виявлення

Деякі метадані plugin до запуску середовища виконання навмисно зберігаються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує точки входу нативного plugin. Має залишатися в межах каталогу пакета plugin.                                                                                               |
| `openclaw.runtimeExtensions`                                      | Оголошує точки входу зібраного JavaScript runtime для встановлених пакетів. Має залишатися в межах каталогу пакета plugin.                                                          |
| `openclaw.setupEntry`                                             | Легка точка входу лише для setup, яка використовується під час онбордингу, відкладеного запуску channel і виявлення status/SecretRef channel у режимі лише читання. Має залишатися в межах каталогу пакета plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує зібрану JavaScript-точку входу setup для встановлених пакетів. Має залишатися в межах каталогу пакета plugin.                                                             |
| `openclaw.channel`                                                | Легкі метадані каталогу channel, такі як мітки, шляхи до документації, псевдоніми та текст для вибору.                                                                              |
| `openclaw.channel.configuredState`                                | Легкі метадані перевірки налаштованого стану, які можуть відповісти на запитання «чи вже існує налаштування лише через env?» без завантаження повного runtime channel.             |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевірки збереженого auth-стану, які можуть відповісти на запитання «чи вже є хоч один вхід у систему?» без завантаження повного runtime channel.                  |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки для встановлення/оновлення вбудованих plugin і plugin, опублікованих зовні.                                                                                                 |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                 |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw, із використанням нижньої межі semver, наприклад `>=2026.3.22`.                                                                      |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення та оновлення перевіряють завантажений артефакт за ним.                                           |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення вбудованого plugin, коли конфігурація невалідна.                                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для setup завантажуватися під час запуску раніше, ніж повний plugin channel.                                                                         |

Метадані маніфесту визначають, які варіанти провайдера/channel/setup з’являються в
онбордингу до завантаження runtime. `package.json#openclaw.install` повідомляє
онбордингу, як отримати або ввімкнути цей plugin, коли користувач вибирає один із цих
варіантів. Не переносіть підказки встановлення до `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та завантаження
реєстру маніфестів. Невалідні значення відхиляються; новіші, але валідні значення пропускають
plugin на старіших хостах.

Точне закріплення версії npm уже живе в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Поєднуйте це з
`expectedIntegrity`, коли хочете, щоб потоки оновлення завершувалися закритою відмовою, якщо завантажений
артефакт npm більше не відповідає закріпленому релізу. Інтерактивний онбординг
пропонує npm specs довіреного реєстру, включно з просто назвами пакетів і dist-tags.
Коли присутній `expectedIntegrity`, потоки встановлення/оновлення застосовують його; коли
він відсутній, дозвіл реєстру записується без pin цілісності.

Plugin channel мають надавати `openclaw.setupEntry`, коли status, список channel
або сканування SecretRef мають визначати налаштовані облікові записи без завантаження повного
runtime. Точка входу setup має надавати метадані channel разом із безпечними для setup адаптерами конфігурації,
status і secrets; зберігайте мережеві клієнти, listeners Gateway і
transport runtimes в основній точці входу extension.

Поля точки входу runtime не перевизначають перевірки меж пакета для полів
точки входу вихідного коду. Наприклад, `openclaw.runtimeExtensions` не може зробити
завантажуваним шлях `openclaw.extensions`, що виходить за межі.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він
не робить довільно зламані конфігурації придатними до встановлення. Наразі він лише дозволяє потокам встановлення
відновлюватися після певних застарілих збоїв оновлення вбудованого plugin, наприклад
відсутнього шляху до вбудованого plugin або застарілого запису `channels.<id>` для цього ж
вбудованого plugin. Непов’язані помилки конфігурації, як і раніше, блокують встановлення та спрямовують операторів
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
у форматі так/ні до завантаження повного plugin channel. Цільовий експорт має бути невеликою
функцією, яка читає лише збережений стан; не маршрутизуйте це через повний barrel runtime
channel.

`openclaw.channel.configuredState` має таку саму форму для дешевих перевірок
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

Використовуйте це, коли channel може відповісти про налаштований стан через env або інші маленькі
невиконувані входи. Якщо перевірка потребує повного розв’язання конфігурації або реального
runtime channel, залиште цю логіку в hook plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати id plugin)

OpenClaw виявляє plugin із кількох коренів (вбудовані, глобальне встановлення, workspace, явно вибрані в конфігурації шляхи). Якщо два виявлені plugin мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч.

Пріоритет від найвищого до найнижчого:

1. **Вибраний у конфігурації** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — plugin, що постачаються з OpenClaw
3. **Глобальне встановлення** — plugin, встановлені в глобальний корінь plugin OpenClaw
4. **Workspace** — plugin, виявлені відносно поточного workspace

Наслідки:

- Розгалужена або застаріла копія вбудованого plugin, що лежить у workspace, не перекриє вбудовану збірку.
- Щоб справді перевизначити вбудований plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтесь на виявлення у workspace.
- Відкидання дублікатів логуються, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен plugin повинен постачатися з JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми проходять валідацію під час читання/запису конфігурації, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` — це **помилки**, якщо тільки id channel не оголошено
  в маніфесті plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **виявлювані** id plugin. Невідомі id — це **помилки**.
- Якщо plugin встановлено, але він має зламаний або відсутній маніфест чи схему,
  валідація завершується помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнено**, конфігурація зберігається, і
  в Doctor + логах показується **попередження**.

Див. [Configuration reference](/uk/gateway/configuration) для повної схеми `plugins.*`.

## Примітки

- Маніфест **обов’язковий для нативних plugin OpenClaw**, включно із завантаженням із локальної файлової системи. Runtime, як і раніше, завантажує модуль plugin окремо; маніфест потрібен лише для виявлення + валідації.
- Нативні маніфести розбираються за допомогою JSON5, тому коментарі, завершальні коми та ключі без лапок дозволені, якщо кінцеве значення все одно є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте користувацьких ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо plugin їх не потребує.
- Ексклюзивні типи plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Метадані env vars (`providerAuthEnvVars`, `channelEnvVars`) є лише декларативними. Status, audit, валідація доставки Cron та інші поверхні лише для читання все одно застосовують політику довіри до plugin і ефективної активації перед тим, як вважати env var налаштованою.
- Щодо метаданих runtime wizard, які потребують коду провайдера, див. [Provider runtime hooks](/uk/plugins/architecture#provider-runtime-hooks).
- Якщо ваш plugin залежить від нативних модулів, задокументуйте кроки збірки та будь-які вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з plugin.
  </Card>
  <Card title="Архітектура plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник SDK plugin і імпорти subpath.
  </Card>
</CardGroup>
