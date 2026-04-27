---
read_when:
    - Ви створюєте plugin для OpenClaw
    - Вам потрібно надати схему конфігурації plugin або налагодити помилки валідації plugin
summary: Вимоги до маніфесту Plugin і JSON schema (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-27T08:31:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b3ffcdfcf09b4480d0cec007d645daebdaeb86a051a233dec192f555359162a
    source_path: plugins/manifest.md
    workflow: 15
---

Ця сторінка стосується лише **власного маніфесту plugin OpenClaw**.

Сумісні макети bundle описано тут: [Пакети Plugin](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw також автоматично визначає ці макети bundle, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі читає метадані bundle разом з оголошеними
коренями skill, коренями команд Claude, типовими значеннями `settings.json` у bundle Claude,
типовими значеннями LSP у bundle Claude та підтримуваними наборами hook, якщо макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен власний plugin OpenClaw **повинен** містити файл `openclaw.plugin.json` у
**корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду plugin**. Відсутні або недійсні маніфести розглядаються як
помилки plugin і блокують валідацію конфігурації.

Повний посібник із системи plugin дивіться тут: [Plugins](/uk/tools/plugin).
Про власну модель можливостей і поточні рекомендації щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw читає **до завантаження коду
вашого plugin**. Усе нижче має бути достатньо легким для перевірки без запуску
середовища виконання plugin.

**Використовуйте його для:**

- ідентичності plugin, валідації конфігурації та підказок для UI конфігурації
- метаданих auth, онбордингу та налаштування (аліас, автоувімкнення, змінні середовища provider, варіанти auth)
- підказок активації для поверхонь control-plane
- скороченого володіння сімействами моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації, специфічних для каналу, що об’єднуються в каталог і поверхні валідації

**Не використовуйте його для:** реєстрації поведінки під час виконання, оголошення
точок входу коду або метаданих встановлення npm. Для цього призначені код вашого plugin
і `package.json`.

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
  "description": "Плагін provider OpenRouter",
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
| `id`                                 | Так         | `string`                         | Канонічний ідентифікатор plugin. Це ідентифікатор, який використовується в `plugins.entries.<id>`.                                                                                                                              |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON schema для конфігурації цього plugin.                                                                                                                                                                              |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає bundle plugin як увімкнений типово. Не вказуйте це поле або встановіть будь-яке значення, відмінне від `true`, щоб plugin залишався типово вимкненим.                                                                  |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі ідентифікатори, які нормалізуються до цього канонічного ідентифікатора plugin.                                                                                                                                         |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Ідентифікатори provider, які мають автоматично вмикати цей plugin, коли auth, конфігурація або посилання на моделі згадують їх.                                                                                                 |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип plugin, який використовується `plugins.slots.*`.                                                                                                                                                        |
| `channels`                           | Ні          | `string[]`                       | Ідентифікатори channel, якими володіє цей plugin. Використовуються для виявлення та валідації конфігурації.                                                                                                                     |
| `providers`                          | Ні          | `string[]`                       | Ідентифікатори provider, якими володіє цей plugin.                                                                                                                                                                                |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Шлях до легковагового модуля виявлення provider, відносний до кореня plugin, для метаданих каталогу provider в межах маніфесту, які можна завантажити без активації повного середовища виконання plugin.                     |
| `modelSupport`                       | Ні          | `object`                         | Метадані скороченого запису для сімейств моделей, якими володіє маніфест, що використовуються для автозавантаження plugin до запуску середовища виконання.                                                                     |
| `modelCatalog`                       | Ні          | `object`                         | Декларативні метадані каталогу моделей для provider, якими володіє цей plugin. Це контракт control-plane для майбутнього читання списків у режимі лише для читання, онбордингу, вибору моделей, аліасів і приховування без завантаження середовища виконання plugin. |
| `modelPricing`                       | Ні          | `object`                         | Політика пошуку зовнішніх цін, якою володіє provider. Використовуйте її, щоб виключити локальні/self-hosted provider із віддалених каталогів цін або зіставити посилання provider з ідентифікаторами каталогів OpenRouter/LiteLLM без жорсткого кодування ідентифікаторів provider у core. |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані хостів/`baseUrl` кінцевих точок, якими володіє маніфест, для маршрутів provider, які core має класифікувати до завантаження середовища виконання provider.                                                             |
| `cliBackends`                        | Ні          | `string[]`                       | Ідентифікатори backend виведення CLI, якими володіє цей plugin. Використовуються для автоактивації під час запуску з явних посилань у конфігурації.                                                                             |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на provider або backend CLI, для яких слід перевірити синтетичний hook auth, яким володіє plugin, під час холодного виявлення моделей до завантаження середовища виконання.                                          |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі ключів API, якими володіє bundle plugin, що представляють не секретний локальний стан, OAuth або стан облікових даних середовища.                                                                          |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, якими володіє цей plugin, що мають створювати обізнану про plugin конфігурацію та діагностику CLI до завантаження середовища виконання.                                                                           |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Застарілі сумісні метадані env для пошуку auth/статусу provider. Для нових plugin надавайте перевагу `setup.providers[].envVars`; OpenClaw усе ще читає це під час вікна знецінення.                                            |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Ідентифікатори provider, які мають повторно використовувати інший ідентифікатор provider для пошуку auth, наприклад provider для кодування, який спільно використовує базовий ключ API provider та профілі auth.             |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Легковагові метадані env для channel, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для налаштування channel на основі env або поверхонь auth, які мають бачити загальні допоміжні засоби запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Легковагові метадані варіантів auth для селекторів онбордингу, визначення бажаного provider і простого зв’язування прапорців CLI.                                                                                               |
| `activation`                         | Ні          | `object`                         | Легковагові метадані планувальника активації для завантаження, яке запускається provider, командою, channel, маршрутом і можливістю. Лише метадані; фактичною поведінкою, як і раніше, володіє середовище виконання plugin. |
| `setup`                              | Ні          | `object`                         | Легковагові дескриптори налаштування/онбордингу, які поверхні виявлення та налаштування можуть перевіряти без завантаження середовища виконання plugin.                                                                          |
| `qaRunners`                          | Ні          | `object[]`                       | Легковагові дескриптори QA runner, які використовує спільний хост `openclaw qa` до завантаження середовища виконання plugin.                                                                                                    |
| `contracts`                          | Ні          | `object`                         | Статичний знімок bundle можливостей для зовнішніх hook auth, speech, транскрипції в реальному часі, голосу в реальному часі, розуміння медіа, генерації зображень, генерації музики, генерації відео, web-fetch, web search і володіння інструментами. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Легковагові типові значення для розуміння медіа для ідентифікаторів provider, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                              |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації channel, якими володіє маніфест, що об’єднуються в поверхні виявлення та валідації до завантаження середовища виконання.                                                                                  |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня plugin.                                                                                                                                                                         |
| `name`                               | Ні          | `string`                         | Зрозуміла людині назва plugin.                                                                                                                                                                                                    |
| `description`                        | Ні          | `string`                         | Короткий опис, що показується в поверхнях plugin.                                                                                                                                                                                 |
| `version`                            | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                                       |
| `uiHints`                            | Ні          | `Record<string, object>`         | Мітки UI, заповнювачі та підказки щодо чутливості для полів конфігурації.                                                                                                                                                         |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або auth.
OpenClaw читає це до завантаження середовища виконання provider.
Списки налаштування provider використовують ці варіанти маніфесту, варіанти
налаштування, похідні від дескрипторів, і метадані каталогу встановлення без
завантаження середовища виконання provider.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                         |
| --------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Ідентифікатор provider, до якого належить цей варіант.                                                  |
| `method`              | Так         | `string`                                        | Ідентифікатор методу auth, до якого слід спрямувати.                                                    |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор варіанта auth, який використовується в онбордингу та потоках CLI.             |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо не вказано, OpenClaw використовує `choiceId`.                               |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для селектора.                                                                |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються вище в інтерактивних селекторах, керованих асистентом.                        |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант у селекторах асистента, але все ще дозволяє ручний вибір через CLI.                    |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори варіантів, які мають перенаправляти користувачів на цей варіант-заміну.       |
| `groupId`             | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для групування пов’язаних варіантів.                                 |
| `groupLabel`          | Ні          | `string`                                        | Мітка цієї групи для користувача.                                                                       |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                    |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ опції для простих потоків auth з одним прапорцем.                                       |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                   |
| `cliOption`           | Ні          | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                                |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | На яких поверхнях онбордингу має відображатися цей варіант. Якщо не вказано, типово використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє назвою команди середовища
виконання, яку користувачі можуть помилково вказати в `plugins.allow` або
спробувати запустити як кореневу команду CLI. OpenClaw використовує ці
метадані для діагностики без імпорту коду середовища виконання plugin.

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

| Поле         | Обов’язкове | Тип               | Що воно означає                                                          |
| ------------ | ----------- | ----------------- | ------------------------------------------------------------------------ |
| `name`       | Так         | `string`          | Назва команди, що належить цьому plugin.                                 |
| `kind`       | Ні          | `"runtime-slash"` | Позначає аліас як slash-команду чату, а не як кореневу команду CLI.      |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід пропонувати для операцій CLI, якщо вона існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може дешево оголосити, які події
control-plane мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не API життєвого циклу. Він не
реєструє поведінку середовища виконання, не замінює `register(...)` і не
гарантує, що код plugin уже виконувався. Планувальник активації використовує
ці поля, щоб звузити коло кандидатів plugin, перш ніж переходити до наявних
метаданих володіння маніфестом, таких як `providers`, `channels`,
`commandAliases`, `setup.providers`, `contracts.tools` і hooks.

Надавайте перевагу найвужчим метаданим, які вже описують володіння.
Використовуйте `providers`, `channels`, `commandAliases`, дескриптори setup або
`contracts`, коли ці поля виражають відповідний зв’язок. Використовуйте
`activation` для додаткових підказок планувальнику, які не можна подати через
ці поля володіння.
Використовуйте верхньорівневий `cliBackends` для аліасів середовища виконання
CLI, таких як `claude-cli`, `codex-cli` або `google-gemini-cli`;
`activation.onAgentHarnesses` призначений лише для вбудованих ідентифікаторів
agent harness, які ще не мають поля володіння.

Цей блок містить лише метадані. Він не реєструє поведінку середовища
виконання і не замінює `register(...)`, `setupEntry` або інші точки входу
середовища виконання/plugin. Поточні споживачі використовують його як підказку
для звуження кола перед ширшим завантаженням plugin, тому відсутність
метаданих активації зазвичай лише впливає на продуктивність; це не повинно
змінювати коректність, доки ще існують застарілі резервні механізми володіння
маніфестом.

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

| Поле               | Обов’язкове | Тип                                                  | Що воно означає                                                                                                                                |
| ------------------ | ----------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `onProviders`      | Ні          | `string[]`                                           | Ідентифікатори provider, які мають включати цей plugin до планів активації/завантаження.                                                       |
| `onAgentHarnesses` | Ні          | `string[]`                                           | Ідентифікатори середовища виконання вбудованих agent harness, які мають включати цей plugin до планів активації/завантаження. Для аліасів backend CLI використовуйте верхньорівневий `cliBackends`. |
| `onCommands`       | Ні          | `string[]`                                           | Ідентифікатори команд, які мають включати цей plugin до планів активації/завантаження.                                                         |
| `onChannels`       | Ні          | `string[]`                                           | Ідентифікатори channel, які мають включати цей plugin до планів активації/завантаження.                                                        |
| `onRoutes`         | Ні          | `string[]`                                           | Типи маршрутів, які мають включати цей plugin до планів активації/завантаження.                                                                |
| `onCapabilities`   | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки щодо можливостей, які використовуються плануванням активації control-plane. За можливості надавайте перевагу вужчим полям.  |

Поточні активні споживачі:

- планування CLI, що запускається командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування запуску середовища виконання agent використовує
  `activation.onAgentHarnesses` для вбудованих harness і верхньорівневий
  `cliBackends[]` для аліасів середовища виконання CLI
- планування setup/channel, що запускається channel, повертається до
  застарілого володіння `channels[]`, коли явні метадані активації channel
  відсутні
- планування setup/runtime, що запускається provider, повертається до
  застарілого володіння `providers[]` і верхньорівневого `cliBackends[]`, коли
  явні метадані активації provider відсутні

Діагностика планувальника може розрізняти явні підказки активації та резервний
механізм володіння маніфестом. Наприклад, `activation-command-hint` означає,
що збіглося `activation.onCommands`, тоді як `manifest-command-alias` означає,
що планувальник натомість використав володіння `commandAliases`. Ці мітки
причин призначені для діагностики хоста та тестів; авторам plugin слід і надалі
оголошувати метадані, які найкраще описують володіння.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або кілька transport runner
під спільним коренем `openclaw qa`. Зберігайте ці метадані простими й
статичними; фактичною реєстрацією CLI, як і раніше, володіє середовище
виконання plugin через легковагову поверхню `runtime-api.ts`, яка експортує
`qaRunnerCliRegistrations`.

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Запускає lane live QA для Matrix на базі Docker на одноразовому homeserver"
    }
  ]
}
```

| Поле          | Обов’язкове | Тип      | Що воно означає                                                    |
| ------------- | ----------- | -------- | ------------------------------------------------------------------ |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.      |
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

## Довідник `setup`

Використовуйте `setup`, коли поверхням setup та онбордингу потрібні дешеві
метадані plugin, якими він володіє, до завантаження середовища виконання.

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

Верхньорівневий `cliBackends` залишається чинним і надалі описує backend
виведення CLI. `setup.cliBackends` — це поверхня дескриптора, специфічна для
setup, для потоків control-plane/setup, які мають залишатися лише метаданими.

Якщо вони присутні, `setup.providers` і `setup.cliBackends` є бажаною
поверхнею пошуку setup за принципом “спочатку дескриптор” для виявлення setup.
Якщо дескриптор лише звужує коло кандидатів plugin, а setup все ще потребує
багатших hook середовища виконання на час setup, установіть
`requiresRuntime: true` і залиште `setup-api` як резервний шлях виконання.

OpenClaw також включає `setup.providers[].envVars` у загальні механізми пошуку
auth provider і змінних середовища. `providerAuthEnvVars` залишається
підтримуваним через адаптер сумісності протягом вікна знецінення, але
неbundle plugin, які все ще його використовують, отримують діагностику
маніфесту. Нові plugin мають розміщувати метадані env для setup/статусу в
`setup.providers[].envVars`.

OpenClaw також може виводити прості варіанти setup із
`setup.providers[].authMethods`, коли запис setup відсутній або коли
`setup.requiresRuntime: false` оголошує, що середовище виконання setup не
потрібне. Явні записи `providerAuthChoices` усе ще мають перевагу для власних
міток, прапорців CLI, області онбордингу та метаданих асистента.

Установлюйте `requiresRuntime: false` лише тоді, коли цих дескрипторів
достатньо для поверхні setup. OpenClaw трактує явне `false` як контракт лише
на дескриптор і не виконуватиме `setup-api` або `openclaw.setupEntry` для
пошуку setup. Якщо plugin, що працює лише через дескриптор, усе ж містить один
із цих записів середовища виконання setup, OpenClaw повідомляє додаткову
діагностику й надалі ігнорує його. Якщо `requiresRuntime` не вказано,
зберігається застаріла резервна поведінка, щоб наявні plugin, які додали
дескриптори без цього прапорця, не ламалися.

Оскільки пошук setup може виконувати код `setup-api`, яким володіє plugin,
нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають
залишатися унікальними серед усіх виявлених plugin. Неоднозначне володіння
завершується безпечним блокуванням замість вибору переможця за порядком
виявлення.

Коли середовище виконання setup усе ж виконується, діагностика реєстру setup
повідомляє про розходження дескрипторів, якщо `setup-api` реєструє provider
або backend CLI, яких не оголошують дескриптори маніфесту, або якщо для
дескриптора немає відповідної реєстрації в середовищі виконання. Ці
діагностичні повідомлення є додатковими й не відхиляють застарілі plugin.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                      |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Так         | `string`   | Ідентифікатор provider, який показується під час setup або онбордингу. Підтримуйте глобальну унікальність нормалізованих ідентифікаторів. |
| `authMethods` | Ні          | `string[]` | Ідентифікатори методів setup/auth, які цей provider підтримує без завантаження повного середовища виконання. |
| `envVars`     | Ні          | `string[]` | Змінні середовища, які загальні поверхні setup/статусу можуть перевіряти до завантаження середовища виконання plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                      |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup provider, доступні під час setup та онбордингу.                                    |
| `cliBackends`      | Ні          | `string[]` | Ідентифікатори backend часу setup, що використовуються для пошуку setup за принципом “спочатку дескриптор”. Підтримуйте глобальну унікальність нормалізованих ідентифікаторів. |
| `configMigrations` | Ні          | `string[]` | Ідентифікатори міграцій конфігурації, якими володіє поверхня setup цього plugin.                     |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескриптором.                                |

## Довідник `uiHints`

`uiHints` — це мапа від назв полів конфігурації до невеликих підказок для
рендерингу.

```json
{
  "uiHints": {
    "apiKey": {
      "label": "Ключ API",
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
| `label`       | `string`   | Мітка поля для користувача.             |
| `help`        | `string`   | Короткий допоміжний текст.              |
| `tags`        | `string[]` | Необов’язкові теги UI.                  |
| `advanced`    | `boolean`  | Позначає поле як розширене.             |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.  |
| `placeholder` | `string`   | Текст-заповнювач для полів форми.       |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння
можливостями, які OpenClaw може читати без імпорту середовища виконання
plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
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
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Кожен список є необов’язковим:

| Поле                             | Тип        | Що воно означає                                                         |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ідентифікатори фабрик extension для app-server Codex, наразі `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Ідентифікатори середовища виконання, для яких bundle plugin може реєструвати middleware результатів інструментів. |
| `externalAuthProviders`          | `string[]` | Ідентифікатори provider, hook зовнішнього профілю auth яких належить цьому plugin. |
| `speechProviders`                | `string[]` | Ідентифікатори provider speech, якими володіє цей plugin.               |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори provider транскрипції в реальному часі, якими володіє цей plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори provider голосу в реальному часі, якими володіє цей plugin. |
| `memoryEmbeddingProviders`       | `string[]` | Ідентифікатори provider embedding для пам’яті, якими володіє цей plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори provider розуміння медіа, якими володіє цей plugin.      |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори provider генерації зображень, якими володіє цей plugin.  |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори provider генерації відео, якими володіє цей plugin.      |
| `webFetchProviders`              | `string[]` | Ідентифікатори provider web-fetch, якими володіє цей plugin.            |
| `webSearchProviders`             | `string[]` | Ідентифікатори provider web search, якими володіє цей plugin.           |
| `migrationProviders`             | `string[]` | Ідентифікатори provider імпорту, якими володіє цей plugin для `openclaw migrate`. |
| `tools`                          | `string[]` | Назви agent tool, якими володіє цей plugin для перевірок контрактів bundle. |

`contracts.embeddedExtensionFactories` збережено для фабрик extension лише для
app-server Codex у bundle. Bundle-трансформації результатів інструментів мають
оголошувати `contracts.agentToolResultMiddleware` і реєструватися через
`api.registerAgentToolResultMiddleware(...)`. Зовнішні plugin не можуть
реєструвати middleware результатів інструментів, тому що цей seam може
переписувати високодовірений вивід інструмента до того, як модель його побачить.

Plugin provider, які реалізують `resolveExternalAuthProfiles`, мають
оголошувати `contracts.externalAuthProviders`. Plugin без цього оголошення все
ще працюють через застарілий механізм сумісності, але він повільніший і буде
видалений після завершення вікна міграції.

Bundle provider embedding для пам’яті мають оголошувати
`contracts.memoryEmbeddingProviders` для кожного ідентифікатора адаптера,
який вони надають, включно з вбудованими адаптерами, такими як `local`.
Окремі шляхи CLI використовують цей контракт маніфесту, щоб завантажувати
лише plugin-власник до того, як повне середовище виконання Gateway зареєструє
provider.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли provider розуміння
медіа має типові моделі, пріоритет резервного автоматичного auth або вбудовану
підтримку документів, які потрібні загальним допоміжним засобам core до
завантаження середовища виконання. Ключі також мають бути оголошені в
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

| Поле                   | Тип                                 | Що воно означає                                                               |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які надає цей provider.                                      |
| `defaultModels`        | `Record<string, string>`            | Типові значення “можливість → модель”, що використовуються, коли в конфігурації не вказано модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються вище для автоматичного резервного вибору provider на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Вбудовані входи документів, які підтримує provider.                           |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли plugin channel потребує дешевих
метаданих конфігурації до завантаження середовища виконання. Виявлення setup/статусу
channel у режимі лише для читання може використовувати ці метадані безпосередньо
для налаштованих зовнішніх channel, коли запис setup недоступний або коли
`setup.requiresRuntime: false` оголошує, що середовище виконання setup не потрібне.

`channelConfigs` — це метадані маніфесту plugin, а не новий верхньорівневий
розділ конфігурації користувача. Користувачі, як і раніше, налаштовують
екземпляри channel у `channels.<channel-id>`. OpenClaw читає метадані
маніфесту, щоб визначити, який plugin володіє цим налаштованим channel, до
виконання коду середовища виконання plugin.

Для plugin channel `configSchema` і `channelConfigs` описують різні шляхи:

- `configSchema` валідує `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` валідує `channels.<channel-id>`

Неbundle plugin, які оголошують `channels[]`, також мають оголошувати
відповідні записи `channelConfigs`. Без них OpenClaw усе ще може завантажити
plugin, але поверхні схем конфігурації холодного шляху, setup і Control UI не
знатимуть форми параметрів, якими володіє channel, доки не виконається
середовище виконання plugin.

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` і
`nativeSkillsAutoEnabled` можуть оголошувати статичні типові значення `auto`
для перевірок конфігурації команд, які виконуються до завантаження середовища
виконання channel. Bundle channel також можуть публікувати такі самі типові
значення через `package.json#openclaw.channel.commands` разом з іншими
метаданими каталогу channel, якими володіє пакет.

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
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

Кожен запис channel може містити:

| Поле          | Тип                      | Що воно означає                                                                          |
| ------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису конфігурації channel. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/заповнювачі/підказки щодо чутливості для цього розділу конфігурації channel. |
| `label`       | `string`                 | Мітка channel, що об’єднується з поверхнями вибору та перегляду, коли метадані середовища виконання ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь перегляду та каталогу.                               |
| `commands`    | `object`                 | Статичні автотипові значення для native command і native skill для перевірок конфігурації до запуску середовища виконання. |
| `preferOver`  | `string[]`               | Ідентифікатори застарілих plugin або plugin із нижчим пріоритетом, які цей channel має випереджати на поверхнях вибору. |

### Заміна іншого plugin channel

Використовуйте `preferOver`, коли ваш plugin є бажаним власником для
ідентифікатора channel, який також може надавати інший plugin. Типові випадки
— перейменований ідентифікатор plugin, окремий plugin, що замінює bundle
plugin, або підтримуваний fork, який зберігає той самий ідентифікатор channel
для сумісності конфігурації.

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

Коли налаштовано `channels.chat`, OpenClaw враховує ідентифікатор channel і
бажаний ідентифікатор plugin. Якщо plugin із нижчим пріоритетом було вибрано
лише тому, що він входить до bundle або увімкнений типово, OpenClaw вимикає
його в ефективній конфігурації середовища виконання, щоб channel і його
інструментами володів один plugin. Явний вибір користувача все одно має
перевагу: якщо користувач явно вмикає обидва plugin, OpenClaw зберігає цей
вибір і повідомляє діагностику дубльованих channel/інструментів замість
мовчазної зміни запитаного набору plugin.

Обмежуйте `preferOver` ідентифікаторами plugin, які справді можуть надавати
той самий channel. Це не загальне поле пріоритету і воно не перейменовує
ключі конфігурації користувача.

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має визначати ваш plugin provider
за скороченими ідентифікаторами моделей на кшталт `gpt-5.5` або
`claude-sonnet-4.6` до завантаження середовища виконання plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий пріоритет:

- явні посилання `provider/model` використовують метадані маніфесту `providers`
  плагіна-власника
- `modelPatterns` мають пріоритет над `modelPrefixes`
- якщо збігаються один небundle plugin і один bundle plugin, перемагає
  небundle plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не
  вкаже provider

Поля:

| Поле            | Тип        | Що воно означає                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими ідентифікаторами моделей. |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими ідентифікаторами моделей після видалення суфікса профілю. |

## Довідник `modelCatalog`

Використовуйте `modelCatalog`, коли OpenClaw має знати метадані моделей
provider до завантаження середовища виконання plugin. Це джерело фіксованих
рядків каталогу, аліасів provider, правил приховування та режиму виявлення,
яким володіє маніфест. Оновлення під час виконання, як і раніше, належить коду
середовища виконання provider, але маніфест повідомляє core, коли середовище
виконання потрібне.

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "недоступно в Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Поля верхнього рівня:

| Поле           | Тип                                                      | Що воно означає                                                                                          |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Рядки каталогу для ідентифікаторів provider, якими володіє цей plugin. Ключі також мають бути присутні у верхньорівневому `providers`. |
| `aliases`      | `Record<string, object>`                                 | Аліаси provider, які мають зводитися до provider-власника для планування каталогу або приховування.     |
| `suppressions` | `object[]`                                               | Рядки моделей з іншого джерела, які цей plugin приховує з причини, специфічної для provider.            |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Чи можна читати каталог provider з метаданих маніфесту, оновлювати в кеш або чи він потребує середовища виконання. |

Поля provider:

| Поле      | Тип                      | Що воно означає                                                    |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Необов’язковий типовий `baseUrl` для моделей у цьому каталозі provider. |
| `api`     | `ModelApi`               | Необов’язковий типовий адаптер API для моделей у цьому каталозі provider. |
| `headers` | `Record<string, string>` | Необов’язкові статичні заголовки, що застосовуються до цього каталогу provider. |
| `models`  | `object[]`               | Обов’язкові рядки моделей. Рядки без `id` ігноруються.             |

Поля моделі:

| Поле            | Тип                                                            | Що воно означає                                                                |
| --------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `id`            | `string`                                                       | Локальний для provider ідентифікатор моделі без префікса `provider/`.          |
| `name`          | `string`                                                       | Необов’язкова відображувана назва.                                             |
| `api`           | `ModelApi`                                                     | Необов’язкове перевизначення API для окремої моделі.                           |
| `baseUrl`       | `string`                                                       | Необов’язкове перевизначення `baseUrl` для окремої моделі.                     |
| `headers`       | `Record<string, string>`                                       | Необов’язкові статичні заголовки для окремої моделі.                           |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | Модальності, які приймає модель.                                               |
| `reasoning`     | `boolean`                                                      | Чи надає модель поведінку reasoning.                                           |
| `contextWindow` | `number`                                                       | Власне вікно контексту provider.                                               |
| `contextTokens` | `number`                                                       | Необов’язкове ефективне обмеження контексту під час виконання, якщо воно відрізняється від `contextWindow`. |
| `maxTokens`     | `number`                                                       | Максимальна кількість вихідних токенів, якщо відома.                           |
| `cost`          | `object`                                                       | Необов’язкова ціна в USD за мільйон токенів, включно з необов’язковим `tieredPricing`. |
| `compat`        | `object`                                                       | Необов’язкові прапорці сумісності, що відповідають сумісності конфігурації моделі OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Статус у списку. Приховуйте лише тоді, коли рядок взагалі не повинен відображатися. |
| `statusReason`  | `string`                                                       | Необов’язкова причина, що показується для статусу “не доступно”.               |
| `replaces`      | `string[]`                                                     | Старіші локальні для provider ідентифікатори моделей, які ця модель замінює.   |
| `replacedBy`    | `string`                                                       | Локальний для provider ідентифікатор моделі-замінника для застарілих рядків.   |
| `tags`          | `string[]`                                                     | Стабільні теги, що використовуються засобами вибору та фільтрами.              |

Не розміщуйте в `modelCatalog` дані лише для середовища виконання. Якщо
provider потребує стану облікового запису, запиту API або виявлення локального
процесу, щоб визначити повний набір моделей, оголосіть цей provider як
`refreshable` або `runtime` у `discovery`.

## Довідник `modelPricing`

Використовуйте `modelPricing`, коли provider потребує поведінки цін у
control-plane до завантаження середовища виконання. Кеш цін Gateway читає ці
метадані без імпорту коду середовища виконання provider.

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Поля provider:

| Поле         | Тип               | Що воно означає                                                                                     |
| ------------ | ----------------- | --------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | Установіть `false` для локальних/self-hosted provider, які ніколи не повинні отримувати ціни з OpenRouter або LiteLLM. |
| `openRouter` | `false \| object` | Мапінг пошуку цін OpenRouter. `false` вимикає пошук OpenRouter для цього provider.                  |
| `liteLLM`    | `false \| object` | Мапінг пошуку цін LiteLLM. `false` вимикає пошук LiteLLM для цього provider.                        |

Поля джерела:

| Поле                       | Тип                | Що воно означає                                                                                                  |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | Ідентифікатор provider у зовнішньому каталозі, коли він відрізняється від ідентифікатора provider OpenClaw, наприклад `z-ai` для provider `zai`. |
| `passthroughProviderModel` | `boolean`          | Розглядати ідентифікатори моделей зі slash як вкладені посилання provider/model; корисно для proxy provider, таких як OpenRouter. |
| `modelIdTransforms`        | `"version-dots"[]` | Додаткові варіанти ідентифікаторів моделей у зовнішньому каталозі. `version-dots` перевіряє ідентифікатори версій із крапками, як-от `claude-opus-4.6`. |

### Індекс Provider OpenClaw

Індекс Provider OpenClaw — це preview-метадані, якими володіє OpenClaw, для
provider, plugin яких ще можуть бути не встановлені. Він не є частиною
маніфесту plugin. Маніфести plugin залишаються авторитетним джерелом для
встановлених plugin. Індекс Provider — це внутрішній резервний контракт, який
в майбутньому використовуватимуть поверхні installable-provider і селектори
моделей до встановлення, коли plugin provider не встановлено.

Порядок авторитетності каталогу:

1. Конфігурація користувача.
2. `modelCatalog` маніфесту встановленого plugin.
3. Кеш каталогу моделей після явного оновлення.
4. Preview-рядки Індексу Provider OpenClaw.

Індекс Provider не повинен містити секрети, стан увімкнення, hooks середовища
виконання або живі дані моделей, специфічні для облікового запису. Його
preview-каталоги використовують ту саму форму рядків provider `modelCatalog`,
що й маніфести plugin, але мають обмежуватися стабільними метаданими
відображення, якщо тільки поля адаптера середовища виконання, такі як `api`,
`baseUrl`, ціни або прапорці сумісності, не підтримуються навмисно
узгодженими з маніфестом встановленого plugin. Provider із живим виявленням
через `/models` мають записувати оновлені рядки через явний шлях кешу каталогу
моделей, а не змушувати звичайне відображення списків або онбординг викликати
API provider.

Записи Індексу Provider також можуть містити метадані installable-plugin для
provider, plugin яких було винесено з core або які ще не встановлено. Ці
метадані повторюють шаблон каталогу channel: назви пакета, специфікація
встановлення npm, очікувана цілісність і легковагові мітки варіантів auth
достатні, щоб показати варіант налаштування встановлюваного plugin. Після
встановлення plugin його маніфест має пріоритет, а запис Індексу Provider для
цього provider ігнорується.

Застарілі верхньорівневі ключі можливостей є deprecated. Використовуйте
`openclaw doctor --fix`, щоб перемістити `speechProviders`,
`realtimeTranscriptionProviders`, `realtimeVoiceProviders`,
`mediaUnderstandingProviders`, `imageGenerationProviders`,
`videoGenerationProviders`, `webFetchProviders` і `webSearchProviders` під
`contracts`; звичайне завантаження маніфесту більше не трактує ці
верхньорівневі поля як володіння можливостями.

## Маніфест проти package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого його використовувати                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів auth і підказки UI, які мають існувати до запуску коду plugin              |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, який використовується для точок входу, контролю встановлення, setup або метаданих каталогу |

Якщо ви не впевнені, куди має належати певний фрагмент метаданих, використовуйте
таке правило:

- якщо OpenClaw має знати це до завантаження коду plugin, розмістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів точок входу або поведінки встановлення npm, розмістіть це в `package.json`

### Поля `package.json`, які впливають на виявлення

Деякі метадані plugin, що потрібні до запуску середовища виконання,
навмисно зберігаються в `package.json` у блоці `openclaw`, а не в
`openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                     |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує точки входу власного plugin. Має залишатися в каталозі пакета plugin.                                                                                                     |
| `openclaw.runtimeExtensions`                                      | Оголошує точки входу built JavaScript середовища виконання для встановлених пакетів. Має залишатися в каталозі пакета plugin.                                                     |
| `openclaw.setupEntry`                                             | Легковагова точка входу лише для setup, що використовується під час онбордингу, відкладеного запуску channel і виявлення статусу channel/SecretRef у режимі лише для читання. Має залишатися в каталозі пакета plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує built JavaScript точку входу setup для встановлених пакетів. Має залишатися в каталозі пакета plugin.                                                                    |
| `openclaw.channel`                                                | Легковагові метадані каталогу channel, такі як мітки, шляхи до документації, аліаси та текст для вибору.                                                                          |
| `openclaw.channel.commands`                                       | Статичні метадані автотипових значень для native command і native skill, які використовуються конфігурацією, аудитом і поверхнями списку команд до завантаження середовища виконання channel. |
| `openclaw.channel.configuredState`                                | Легковагові метадані перевірки налаштованого стану, які можуть відповісти на запитання «чи вже існує setup лише через env?» без завантаження повного середовища виконання channel. |
| `openclaw.channel.persistedAuthState`                             | Легковагові метадані перевірки збереженого стану auth, які можуть відповісти на запитання «чи вже є якийсь вхід у систему?» без завантаження повного середовища виконання channel. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки щодо встановлення/оновлення для bundle plugin і plugin, опублікованих зовнішньо.                                                                                          |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                               |
| `openclaw.install.minHostVersion`                                 | Мінімально підтримувана версія хоста OpenClaw з використанням нижньої межі semver, наприклад `>=2026.3.22`.                                                                       |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення та оновлення звіряють із ним отриманий артефакт.                                               |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення bundle plugin, коли конфігурація недійсна.                                                                                |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для setup завантажуватися до повного plugin channel під час запуску.                                                                               |

Метадані маніфесту визначають, які варіанти provider/channel/setup з’являються
в онбордингу до завантаження середовища виконання. `package.json#openclaw.install`
повідомляє онбордингу, як отримати або ввімкнути цей plugin, коли користувач
обирає один із цих варіантів. Не переносіть підказки щодо встановлення в
`openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та
завантаження реєстру маніфестів. Недійсні значення відхиляються; новіші, але
коректні значення пропускають plugin на старіших хостах.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього
каталогу мають поєднувати точні специфікації з `expectedIntegrity`, щоб потоки
оновлення завершувалися безпечним блокуванням, якщо отриманий артефакт npm
більше не відповідає закріпленому релізу. Інтерактивний онбординг, як і
раніше, пропонує довірені специфікації npm реєстру, включно з голими назвами
пакетів і dist-tag, для сумісності. Діагностика каталогу може розрізняти
точні, плаваючі, закріплені за цілісністю, без цілісності, з невідповідністю
назви пакета та з недійсним source default-choice. Вона також попереджає, коли
`expectedIntegrity` присутній, але немає коректного npm source, який можна
закріпити. Коли `expectedIntegrity` присутній, потоки встановлення/оновлення
застосовують його; коли його пропущено, розв’язання реєстру записується без
закріплення за цілісністю.

Plugin channel мають надавати `openclaw.setupEntry`, коли статус, список
channel або сканування SecretRef потребують визначення налаштованих облікових
записів без завантаження повного середовища виконання. Запис setup має
експонувати метадані channel разом із безпечними для setup адаптерами
конфігурації, статусу та секретів; мережеві клієнти, слухачі Gateway і
transport runtime слід тримати в основній точці входу extension.

Поля точки входу середовища виконання не скасовують перевірки меж пакета для
полів точки входу джерела. Наприклад, `openclaw.runtimeExtensions` не може
зробити шлях `openclaw.extensions`, що виходить за межі пакета, придатним до
завантаження.

`openclaw.install.allowInvalidConfigRecovery` навмисно має вузьке
призначення. Він не робить довільні зламані конфігурації придатними для
встановлення. Наразі він лише дозволяє потокам встановлення відновлюватися
після певних застарілих збоїв оновлення bundle plugin, наприклад відсутнього
шляху до bundle plugin або застарілого запису `channels.<id>` для того самого
bundle plugin. Непов’язані помилки конфігурації, як і раніше, блокують
встановлення та спрямовують операторів до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це метадані пакета для крихітного
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

Використовуйте його, коли потокам setup, doctor або configured-state потрібна
дешева перевірка auth “так/ні” до завантаження повного plugin channel.
Цільовий export має бути невеликою функцією, яка лише читає збережений стан;
не маршрутизуйте його через повний barrel середовища виконання channel.

`openclaw.channel.configuredState` має ту саму форму для дешевих перевірок
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

Використовуйте це, коли channel може визначити налаштований стан на основі env
або інших невеликих невиконавчих вхідних даних. Якщо перевірка потребує
повного розв’язання конфігурації або справжнього середовища виконання channel,
залишайте цю логіку в hook `config.hasConfiguredState` plugin.

## Пріоритет виявлення (дубльовані ідентифікатори plugin)

OpenClaw виявляє plugin із кількох коренів (bundle, глобальне встановлення,
workspace, явно вибрані в конфігурації шляхи). Якщо два виявлені plugin мають
однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**;
дублікати з нижчим пріоритетом відкидаються, а не завантажуються поруч із ним.

Пріоритет від найвищого до найнижчого:

1. **Вибраний у конфігурації** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Bundled** — plugin, що постачаються з OpenClaw
3. **Глобальне встановлення** — plugin, встановлені в глобальний корінь plugin OpenClaw
4. **Workspace** — plugin, виявлені відносно поточного workspace

Наслідки:

- Fork або застаріла копія bundled plugin у workspace не перекриє bundled-збірку.
- Щоб справді перевизначити bundled plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтеся на виявлення у workspace.
- Відкинуті дублікати записуються в журнал, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен plugin повинен постачати JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня schema є допустимою (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми проходять валідацію під час читання/запису конфігурації, а не під час виконання.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки ідентифікатор channel не оголошено в маніфесті plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  повинні посилатися на **plugin id, які можна виявити**. Невідомі ідентифікатори є **помилками**.
- Якщо plugin встановлено, але він має зламаний або відсутній маніфест чи schema,
  валідація завершується помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнено**, конфігурація зберігається, і
  в Doctor + журналах з’являється **попередження**.

Повну схему `plugins.*` дивіться в [Довіднику з конфігурації](/uk/gateway/configuration).

## Примітки

- Маніфест **обов’язковий для власних plugin OpenClaw**, зокрема для завантаження з локальної файлової системи. Середовище виконання, як і раніше, завантажує модуль plugin окремо; маніфест використовується лише для виявлення + валідації.
- Власні маніфести розбираються за допомогою JSON5, тому коментарі, кінцеві коми та ключі без лапок допускаються, якщо кінцеве значення все ще є об’єктом.
- Завантажувач маніфесту читає лише документовані поля маніфесту. Уникайте користувацьких верхньорівневих ключів.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо plugin їх не потребує.
- `providerDiscoveryEntry` має залишатися легковаговим і не повинен імпортувати широкий код середовища виконання; використовуйте його для статичних метаданих каталогу provider або вузьких дескрипторів виявлення, а не для виконання під час запитів.
- Ексклюзивні типи plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Метадані змінних середовища (`setup.providers[].envVars`, застарілий `providerAuthEnvVars` і `channelEnvVars`) є лише декларативними. Статус, аудит, валідація доставки Cron та інші поверхні лише для читання все одно застосовують політику довіри до plugin і ефективної активації, перш ніж вважати змінну середовища налаштованою.
- Метадані wizard середовища виконання, які потребують коду provider, дивіться в [Хуки середовища виконання Provider](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш plugin залежить від власних модулів, задокументуйте кроки збірки та всі вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з plugin.
  </Card>
  <Card title="Архітектура plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник SDK plugin та імпорти підшляхів.
  </Card>
</CardGroup>
