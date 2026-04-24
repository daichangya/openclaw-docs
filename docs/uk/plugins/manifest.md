---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно постачати схему конфігурації Plugin або налагоджувати помилки валідації Plugin
summary: Вимоги до маніфесту Plugin + схеми JSON (сувора валідація конфігурації)
title: маніфест Plugin
x-i18n:
    generated_at: "2026-04-24T05:09:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: d27765f1efc9720bd68c73d3ede796a91e9afec479f89eda531dd14adc708e53
    source_path: plugins/manifest.md
    workflow: 15
---

Ця сторінка призначена лише для **власного маніфесту Plugin OpenClaw**.

Сумісні макети bundle див. у [Plugin bundles](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети bundle, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі читає метадані bundle разом з оголошеними
коренями skill, коренями команд Claude, типовими значеннями `settings.json` для bundle Claude,
типовими значеннями LSP для bundle Claude та підтримуваними наборами hook, коли макет відповідає
очікуванням рантайму OpenClaw.

Кожен власний Plugin OpenClaw **повинен** постачатися з файлом `openclaw.plugin.json` у
**корені Plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду Plugin**. Відсутні або недійсні маніфести вважаються
помилками Plugin і блокують валідацію конфігурації.

Повний посібник із системи Plugin див.: [Plugins](/uk/tools/plugin).
Про власну модель можливостей і поточні рекомендації щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **до завантаження коду
вашого Plugin**. Усе нижче має бути достатньо легким для перевірки без запуску
рантайму Plugin.

**Використовуйте його для:**

- ідентичності Plugin, валідації конфігурації та підказок для UI конфігурації
- метаданих автентифікації, онбордингу та налаштування (псевдонім, автоувімкнення, env vars провайдера, варіанти автентифікації)
- підказок активації для поверхонь control-plane
- скороченого володіння сімейством моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації, специфічних для channel, об’єднаних у поверхні каталогу та валідації

**Не використовуйте його для:** реєстрації поведінки рантайму, оголошення
точок входу коду або метаданих встановлення npm. Вони належать до коду вашого Plugin і `package.json`.

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

| Поле                                 | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                                                   |
| ------------------------------------ | ----------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний id Plugin. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                                                     |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього Plugin.                                                                                                                                                                             |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований Plugin як увімкнений за замовчуванням. Не вказуйте його або задайте будь-яке значення, відмінне від `true`, щоб Plugin залишався вимкненим за замовчуванням.                                              |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id Plugin.                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | id провайдерів, які повинні автоматично вмикати цей Plugin, коли автентифікація, конфігурація або посилання на моделі згадують їх.                                                                                              |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує винятковий тип Plugin, що використовується `plugins.slots.*`.                                                                                                                                                           |
| `channels`                           | Ні          | `string[]`                       | id channel, якими володіє цей Plugin. Використовується для виявлення та валідації конфігурації.                                                                                                                                 |
| `providers`                          | Ні          | `string[]`                       | id провайдерів, якими володіє цей Plugin.                                                                                                                                                                                         |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Шлях до легковагового модуля виявлення провайдера, відносний до кореня Plugin, для метаданих каталогу провайдерів в межах маніфесту, які можна завантажити без активації повного рантайму Plugin.                             |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейства моделей, що належать маніфесту та використовуються для автозавантаження Plugin до запуску рантайму.                                                                                                |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані хостів endpoint/baseUrl, що належать маніфесту, для маршрутів провайдера, які ядро повинно класифікувати до завантаження рантайму провайдера.                                                                          |
| `cliBackends`                        | Ні          | `string[]`                       | id backend CLI, якими володіє цей Plugin. Використовуються для автоактивації під час запуску на основі явних посилань у конфігурації.                                                                                           |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на провайдер або backend CLI, для яких належний Plugin synthetic hook автентифікації слід перевіряти під час холодного виявлення моделей до завантаження рантайму.                                                   |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API key, що належать вбудованому Plugin та представляють не секретний локальний стан, OAuth або стан ambient credentials.                                                                                   |
| `commandAliases`                     | Ні          | `object[]`                       | Назви команд, якими володіє цей Plugin, що повинні створювати діагностику конфігурації та CLI з урахуванням Plugin до завантаження рантайму.                                                                                     |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Легковагові env-метадані автентифікації провайдера, які OpenClaw може перевіряти без завантаження коду Plugin.                                                                                                                 |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | id провайдерів, які повинні повторно використовувати інший id провайдера для пошуку автентифікації, наприклад провайдер для кодування, який спільно використовує API key базового провайдера та профілі автентифікації.      |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Легковагові env-метадані channel, які OpenClaw може перевіряти без завантаження коду Plugin. Використовуйте це для налаштування channel через env або поверхонь автентифікації, які мають бачити загальні помічники запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Легковагові метадані варіантів автентифікації для селекторів онбордингу, визначення пріоритетного провайдера та простого зв’язування прапорців CLI.                                                                              |
| `activation`                         | Ні          | `object`                         | Легковагові метадані планувальника активації для завантаження, що запускається провайдером, командою, channel, маршрутом і можливостями. Лише метадані; фактична поведінка все одно належить рантайму Plugin.                |
| `setup`                              | Ні          | `object`                         | Легковагові дескриптори налаштування/онбордингу, які поверхні виявлення та налаштування можуть перевіряти без завантаження рантайму Plugin.                                                                                     |
| `qaRunners`                          | Ні          | `object[]`                       | Легковагові дескриптори QA runner, які використовує спільний хост `openclaw qa` до завантаження рантайму Plugin.                                                                                                               |
| `contracts`                          | Ні          | `object`                         | Статичний знімок вбудованих можливостей для зовнішніх hook автентифікації, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння інструментами. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Легковагові типові значення media-understanding для id провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                       |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації channel, що належать маніфесту та об’єднуються в поверхні виявлення та валідації до завантаження рантайму.                                                                                                |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносні до кореня Plugin.                                                                                                                                                                      |
| `name`                               | Ні          | `string`                         | Зрозуміла для людини назва Plugin.                                                                                                                                                                                                |
| `description`                        | Ні          | `string`                         | Короткий опис, що показується в поверхнях Plugin.                                                                                                                                                                                |
| `version`                            | Ні          | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | Ні          | `Record<string, object>`         | Мітки UI, заповнювачі та підказки щодо чутливості для полів конфігурації.                                                                                                                                                        |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або автентифікації.
OpenClaw читає це до завантаження рантайму провайдера.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                         |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | id провайдера, до якого належить цей варіант.                                                           |
| `method`              | Так         | `string`                                        | id методу автентифікації, до якого слід диспетчеризувати.                                               |
| `choiceId`            | Так         | `string`                                        | Стабільний id варіанта автентифікації, який використовується в потоках онбордингу та CLI.              |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо не вказано, OpenClaw використовує `choiceId`.                               |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для селектора.                                                                |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних селекторах, керованих асистентом.                     |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант із селекторів асистента, але все ще дозволяє ручний вибір через CLI.                  |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі id варіантів, які повинні перенаправляти користувачів на цей варіант-заміну.                 |
| `groupId`             | Ні          | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                            |
| `groupLabel`          | Ні          | `string`                                        | Мітка цієї групи для користувача.                                                                       |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                    |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків автентифікації з одним прапорцем.                         |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                   |
| `cliOption`           | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                              |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з’являтися цей варіант. Якщо не вказано, за замовчуванням це `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли Plugin володіє назвою команди рантайму, яку користувачі можуть
помилково вказати в `plugins.allow` або спробувати виконати як кореневу команду CLI. OpenClaw
використовує ці метадані для діагностики без імпорту коду рантайму Plugin.

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
| `name`       | Так         | `string`          | Назва команди, яка належить цьому Plugin.                                      |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не як кореневу команду CLI.        |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід рекомендувати для операцій CLI, якщо вона існує. |

## Довідник `activation`

Використовуйте `activation`, коли Plugin може недорого оголосити, які події control-plane
мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не API життєвого циклу. Він не реєструє
поведінку рантайму, не замінює `register(...)` і не гарантує, що код
Plugin уже виконався. Планувальник активації використовує ці поля, щоб
звузити коло кандидатів Plugin перед поверненням до наявних метаданих
володіння з маніфесту, таких як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks.

Віддавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте
`providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`,
коли ці поля виражають цей зв’язок. Використовуйте `activation` для додаткових підказок
планувальника, які не можна подати цими полями володіння.

Цей блок — лише метадані. Він не реєструє поведінку рантайму й не
замінює `register(...)`, `setupEntry` або інші точки входу рантайму/Plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням Plugin, тому
відсутність метаданих активації зазвичай лише знижує продуктивність; це не повинно
змінювати коректність, поки ще існують застарілі резервні механізми володіння з маніфесту.

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

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                                                         |
| ---------------- | ----------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Ні          | `string[]`                                           | id провайдерів, які повинні включати цей Plugin у плани активації/завантаження.                        |
| `onCommands`     | Ні          | `string[]`                                           | id команд, які повинні включати цей Plugin у плани активації/завантаження.                             |
| `onChannels`     | Ні          | `string[]`                                           | id channel, які повинні включати цей Plugin у плани активації/завантаження.                            |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які повинні включати цей Plugin у плани активації/завантаження.                        |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки щодо можливостей, які використовуються в плануванні активації control-plane. За можливості віддавайте перевагу вужчим полям. |

Поточні активні споживачі:

- планування CLI, запущене командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/channel, запущене channel, повертається до застарілого
  володіння `channels[]`, коли явні метадані активації channel відсутні
- планування setup/runtime, запущене провайдером, повертається до застарілого
  володіння `providers[]` і верхньорівневого `cliBackends[]`, коли явні метадані
  активації провайдера відсутні

Діагностика планувальника може відрізняти явні підказки активації від резервного
використання володіння з маніфесту. Наприклад, `activation-command-hint` означає, що
співпало `activation.onCommands`, тоді як `manifest-command-alias` означає, що
планувальник натомість використав володіння `commandAliases`. Ці мітки причин призначені для
діагностики хоста та тестів; авторам Plugin слід і надалі оголошувати метадані,
які найкраще описують володіння.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли Plugin додає один або більше transport runner під
спільним коренем `openclaw qa`. Зберігайте ці метадані легкими та статичними; рантайм
Plugin як і раніше володіє фактичною реєстрацією CLI через легковагову
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

| Поле          | Обов’язкове | Тип      | Що воно означає                                                      |
| ------------- | ----------- | -------- | -------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.        |
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

## Довідник `setup`

Використовуйте `setup`, коли поверхням налаштування та онбордингу потрібні легковагові метадані,
що належать Plugin, до завантаження рантайму.

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

Верхньорівневе `cliBackends` залишається чинним і продовжує описувати
backend CLI inference. `setup.cliBackends` — це поверхня дескрипторів, специфічна для setup, для
потоків control-plane/setup, які мають залишатися лише на рівні метаданих.

За наявності `setup.providers` і `setup.cliBackends` є
бажаною поверхнею пошуку setup з підходом descriptor-first для виявлення setup. Якщо дескриптор лише
звужує коло кандидатів Plugin і setup все ще потребує багатших hook рантайму під час setup,
встановіть `requiresRuntime: true` і залиште `setup-api` як
резервний шлях виконання.

Оскільки пошук setup може виконувати код `setup-api`, що належить Plugin,
нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними
серед виявлених Plugin. Неоднозначне володіння закривається за замовчуванням, а не вибирає
переможця відповідно до порядку виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                        |
| ------------- | ----------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | id провайдера, що надається під час setup або онбордингу. Нормалізовані id мають бути глобально унікальними. |
| `authMethods` | Ні          | `string[]` | id методів setup/автентифікації, які цей провайдер підтримує без завантаження повного рантайму. |
| `envVars`     | Ні          | `string[]` | Env vars, які загальні поверхні setup/status можуть перевіряти до завантаження рантайму Plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                       |
| ------------------ | ----------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup провайдера, що надаються під час setup та онбордингу.                              |
| `cliBackends`      | Ні          | `string[]` | id backend для setup-часу, що використовуються для пошуку setup descriptor-first. Нормалізовані id мають бути глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | id міграцій конфігурації, якими володіє поверхня setup цього Plugin.                                 |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескриптором.                                |

## Довідник `uiHints`

`uiHints` — це мапа від назв полів конфігурації до невеликих підказок рендерингу.

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

| Поле          | Тип        | Що воно означає                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Мітка поля для користувача.             |
| `help`        | `string`   | Короткий допоміжний текст.              |
| `tags`        | `string[]` | Необов’язкові теги UI.                  |
| `advanced`    | `boolean`  | Позначає поле як розширене.             |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.  |
| `placeholder` | `string`   | Текст-заповнювач для полів форми.       |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
читати без імпорту рантайму Plugin.

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

| Поле                             | Тип        | Що воно означає                                                      |
| -------------------------------- | ---------- | -------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | id вбудованого рантайму, для яких вбудований Plugin може реєструвати factory. |
| `externalAuthProviders`          | `string[]` | id провайдерів, чий зовнішній hook профілю автентифікації належить цьому Plugin. |
| `speechProviders`                | `string[]` | id speech-провайдерів, якими володіє цей Plugin.                     |
| `realtimeTranscriptionProviders` | `string[]` | id провайдерів realtime-transcription, якими володіє цей Plugin.     |
| `realtimeVoiceProviders`         | `string[]` | id провайдерів realtime-voice, якими володіє цей Plugin.             |
| `memoryEmbeddingProviders`       | `string[]` | id провайдерів memory embedding, якими володіє цей Plugin.           |
| `mediaUnderstandingProviders`    | `string[]` | id провайдерів media-understanding, якими володіє цей Plugin.        |
| `imageGenerationProviders`       | `string[]` | id провайдерів image-generation, якими володіє цей Plugin.           |
| `videoGenerationProviders`       | `string[]` | id провайдерів video-generation, якими володіє цей Plugin.           |
| `webFetchProviders`              | `string[]` | id провайдерів web-fetch, якими володіє цей Plugin.                  |
| `webSearchProviders`             | `string[]` | id провайдерів web search, якими володіє цей Plugin.                 |
| `tools`                          | `string[]` | Назви agent tool, якими володіє цей Plugin для перевірок вбудованих контрактів. |

Plugin провайдерів, які реалізують `resolveExternalAuthProfiles`, повинні оголошувати
`contracts.externalAuthProviders`. Plugins без цього оголошення все ще працюють
через застарілий резервний механізм сумісності, але цей механізм повільніший і
буде видалений після завершення вікна міграції.

Вбудовані провайдери memory embedding повинні оголошувати
`contracts.memoryEmbeddingProviders` для кожного id адаптера, який вони надають, включно з
вбудованими адаптерами, такими як `local`. Автономні шляхи CLI використовують цей контракт
маніфесту, щоб завантажувати лише Plugin-власник до того, як повний рантайм Gateway
зареєструє провайдерів.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли провайдер media-understanding має
типові моделі, пріоритет резервної автоавтентифікації або нативну підтримку документів, які
потрібні загальним помічникам ядра до завантаження рантайму. Ключі також мають бути оголошені в
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

| Поле                   | Тип                                 | Що воно означає                                                                 |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей провайдер.                                        |
| `defaultModels`        | `Record<string, string>`            | Типові значення відповідності можливість-модель, що використовуються, коли в конфігурації не задано модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору провайдера на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні входи документів, які підтримує провайдер.                               |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли Plugin channel потребує легковагових метаданих конфігурації до
завантаження рантайму.

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

| Поле          | Тип                      | Що воно означає                                                                               |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації channel. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/заповнювачі/підказки чутливості для цього розділу конфігурації channel. |
| `label`       | `string`                 | Мітка channel, що об’єднується в поверхнях вибору та перевірки, коли метадані рантайму ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь перевірки та каталогу.                                    |
| `preferOver`  | `string[]`               | id застарілих або менш пріоритетних Plugin, які цей channel має випереджати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш Plugin провайдера з
скорочених id моделей на кшталт `gpt-5.5` або `claude-sonnet-4.6` до завантаження рантайму Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий пріоритет:

- явні посилання `provider/model` використовують метадані маніфесту-власника `providers`
- `modelPatterns` мають пріоритет над `modelPrefixes`
- якщо збігаються один невбудований Plugin і один вбудований Plugin, перемагає невбудований
  Plugin
- решта неоднозначностей ігноруються, доки користувач або конфігурація не вкаже провайдера

Поля:

| Поле            | Тип        | Що воно означає                                                                   |
| --------------- | ---------- | --------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що перевіряються через `startsWith` для скорочених id моделей.          |
| `modelPatterns` | `string[]` | Джерела regex, що перевіряються для скорочених id моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня більше не рекомендовані. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` під `contracts`; звичайне
завантаження маніфесту більше не розглядає ці поля верхнього рівня як
власність можливостей.

## Маніфест порівняно з `package.json`

Ці два файли виконують різні завдання:

| Файл                   | Для чого використовувати                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів автентифікації та підказки UI, які мають існувати до запуску коду Plugin |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, що використовується для точок входу, обмежень встановлення, setup або метаданих каталогу |

Якщо ви не впевнені, куди належить певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw має знати це до завантаження коду Plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів точок входу або поведінки встановлення npm, помістіть це в `package.json`

### Поля `package.json`, які впливають на виявлення

Деякі метадані Plugin до запуску рантайму навмисно зберігаються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує точки входу власного Plugin. Має залишатися в межах каталогу пакета Plugin.                                                                                                |
| `openclaw.runtimeExtensions`                                      | Оголошує точки входу рантайму зібраного JavaScript для встановлених пакетів. Має залишатися в межах каталогу пакета Plugin.                                                        |
| `openclaw.setupEntry`                                             | Легковагова точка входу лише для setup, що використовується під час онбордингу, відкладеного запуску channel і виявлення статусу channel/SecretRef у режимі лише читання. Має залишатися в межах каталогу пакета Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує точку входу setup зібраного JavaScript для встановлених пакетів. Має залишатися в межах каталогу пакета Plugin.                                                           |
| `openclaw.channel`                                                | Легковагові метадані каталогу channel, такі як мітки, шляхи до документації, псевдоніми та текст для вибору.                                                                       |
| `openclaw.channel.configuredState`                                | Легковагові метадані перевірки configured-state, які можуть відповісти на питання «чи вже існує налаштування лише через env?» без завантаження повного рантайму channel.            |
| `openclaw.channel.persistedAuthState`                             | Легковагові метадані перевірки persisted-auth, які можуть відповісти на питання «чи вже виконано вхід бодай десь?» без завантаження повного рантайму channel.                       |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для вбудованих і зовнішньо опублікованих Plugins.                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                 |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw, із використанням нижньої межі semver на кшталт `>=2026.3.22`.                                                                       |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення й оновлення звіряють із ним завантажений артефакт.                                               |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення вбудованого Plugin, коли конфігурація недійсна.                                                                            |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для setup завантажуватися до повного Plugin channel під час запуску.                                                                                |

Метадані маніфесту визначають, які варіанти провайдера/channel/setup з’являються в
онбордингу до завантаження рантайму. `package.json#openclaw.install` повідомляє
онбордингу, як отримати або ввімкнути цей Plugin, коли користувач вибирає один із цих
варіантів. Не переносьте підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` перевіряється під час встановлення та завантаження
реєстру маніфестів. Недійсні значення відхиляються; новіші, але коректні значення пропускають
Plugin на старіших хостах.

Точне закріплення версії npm уже знаходиться в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Поєднуйте це з
`expectedIntegrity`, коли хочете, щоб потоки оновлення завершувалися із закритою помилкою, якщо завантажений
артефакт npm більше не відповідає закріпленому релізу. Інтерактивний онбординг
пропонує npm-spec із довіреного реєстру, включно з голими назвами пакетів і dist-tag.
Коли `expectedIntegrity` присутній, потоки встановлення/оновлення застосовують його; коли його
пропущено, розв’язання через реєстр записується без pin цілісності.

Plugins channel повинні надавати `openclaw.setupEntry`, коли статус, список channel
або сканування SecretRef мають визначати налаштовані облікові записи без завантаження повного
рантайму. Точка входу setup повинна надавати метадані channel разом із безпечними для setup адаптерами
конфігурації, статусу та секретів; мережеві клієнти, listener Gateway і
transport runtime слід залишати в основній точці входу extension.

Поля точки входу рантайму не перевизначають перевірки меж пакета для
полів точки входу джерела. Наприклад, `openclaw.runtimeExtensions` не може зробити
завантажуваним шлях `openclaw.extensions`, що виходить за межі пакета.

`openclaw.install.allowInvalidConfigRecovery` навмисно є вузьким. Воно
не робить довільно зламані конфігурації придатними до встановлення. Наразі воно лише дозволяє потокам встановлення
відновлюватися після певних застарілих збоїв оновлення вбудованого Plugin, таких як
відсутній шлях до вбудованого Plugin або застарілий запис `channels.<id>` для того самого
вбудованого Plugin. Не пов’язані помилки конфігурації все одно блокують встановлення та спрямовують операторів
до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це метадані пакета для маленького
модуля перевірки:

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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна дешева перевірка
автентифікації у форматі так/ні до завантаження повного Plugin channel. Цільовий export має бути невеликою
функцією, яка читає лише збережений стан; не спрямовуйте його через повний
barrel рантайму channel.

`openclaw.channel.configuredState` дотримується тієї самої форми для дешевих перевірок
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

Використовуйте це, коли channel може визначити configured-state через env або інші невеликі
нерантаймові входи. Якщо перевірка потребує повного розв’язання конфігурації або справжнього
рантайму channel, натомість залишайте цю логіку в hook Plugin `config.hasConfiguredState`.

## Пріоритет виявлення (дублікати id Plugin)

OpenClaw виявляє Plugins з кількох коренів (вбудовані, глобальне встановлення, workspace, явно вибрані в конфігурації шляхи). Якщо два знайдені Plugins мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч.

Пріоритет, від найвищого до найнижчого:

1. **Вибраний у конфігурації** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — Plugins, що постачаються з OpenClaw
3. **Глобально встановлений** — Plugins, встановлені в глобальний корінь Plugin OpenClaw
4. **Workspace** — Plugins, виявлені відносно поточного workspace

Наслідки:

- Форк або застаріла копія вбудованого Plugin, що лежить у workspace, не перекриє вбудовану збірку.
- Щоб справді перевизначити вбудований Plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він вигравав за пріоритетом, а не покладався на виявлення у workspace.
- Відкидання дублікатів записується в логи, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен Plugin повинен постачатися з JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема допустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми проходять валідацію під час читання/запису конфігурації, а не під час рантайму.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки id channel не оголошено
  в маніфесті Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  повинні посилатися на id Plugin, які **можна виявити**. Невідомі id є **помилками**.
- Якщо Plugin встановлено, але він має зламаний або відсутній маніфест чи схему,
  валідація завершується помилкою, а Doctor повідомляє про помилку Plugin.
- Якщо конфігурація Plugin існує, але Plugin **вимкнений**, конфігурація зберігається, і
  **попередження** виводиться в Doctor + логах.

Повну схему `plugins.*` див. у [Довіднику з конфігурації](/uk/gateway/configuration).

## Примітки

- Маніфест **обов’язковий для власних Plugins OpenClaw**, включно із завантаженням із локальної файлової системи. Рантайм усе одно завантажує модуль Plugin окремо; маніфест використовується лише для виявлення + валідації.
- Власні маніфести розбираються за допомогою JSON5, тому коментарі, кінцеві коми й ключі без лапок підтримуються, якщо кінцеве значення все ще є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте власних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо Plugin їх не потребує.
- `providerDiscoveryEntry` має залишатися легковаговим і не повинен імпортувати широкий код рантайму; використовуйте його для статичних метаданих каталогу провайдерів або вузьких дескрипторів виявлення, а не для виконання під час обробки запиту.
- Виняткові типи Plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Метадані env var (`providerAuthEnvVars`, `channelEnvVars`) є лише декларативними. Статус, аудит, перевірка доставлення Cron та інші поверхні лише для читання все одно застосовують політику довіри до Plugin і ефективної активації, перш ніж вважати env var налаштованою.
- Метадані wizard рантайму, які потребують коду провайдера, див. у [Hook рантайму провайдера](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш Plugin залежить від нативних модулів, задокументуйте кроки збірки та будь-які вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення Plugins" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з Plugins.
  </Card>
  <Card title="Архітектура Plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник SDK Plugin і імпорти subpath.
  </Card>
</CardGroup>
