---
read_when:
    - Ви створюєте Plugin OpenClaw
    - Вам потрібно надати схему конфігурації Plugin або налагодити помилки валідації Plugin
summary: Маніфест Plugin + вимоги до JSON schema (сувора валідація конфігурації)
title: маніфест Plugin
x-i18n:
    generated_at: "2026-04-26T04:25:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8e33fe37d43ea78c941fbce5af3564c4fae5740e04a0dfaa321163f94b5ef876
    source_path: plugins/manifest.md
    workflow: 15
---

Ця сторінка стосується лише **нативного маніфесту Plugin OpenClaw**.

Сумісні формати структури пакунків див. у [Plugin bundles](/uk/plugins/bundles).

Сумісні формати пакунків використовують інші файли маніфесту:

- Пакунок Codex: `.codex-plugin/plugin.json`
- Пакунок Claude: `.claude-plugin/plugin.json` або типова структура компонента Claude
  без маніфесту
- Пакунок Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці структури пакунків, але вони не проходять валідацію
за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних пакунків OpenClaw наразі читає метадані пакунка разом із оголошеними
коренями skill, коренями команд Claude, типовими значеннями `settings.json` пакунка Claude,
типовими значеннями LSP пакунка Claude та підтримуваними наборами hook, коли структура
відповідає очікуванням середовища виконання OpenClaw.

Кожен нативний Plugin OpenClaw **має** містити файл `openclaw.plugin.json` у
**корені Plugin**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду Plugin**. Відсутні або недійсні маніфести вважаються
помилками Plugin і блокують валідацію конфігурації.

Повний посібник із системи Plugin див. у [Plugins](/uk/tools/plugin).
Про нативну модель можливостей і поточні рекомендації щодо зовнішньої сумісності:
[Модель можливостей](/uk/plugins/architecture#public-capability-model).

## Для чого потрібен цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує **до завантаження коду
вашого Plugin**. Усе нижче має бути достатньо легким для перевірки без запуску
середовища виконання Plugin.

**Використовуйте його для:**

- ідентичності Plugin, валідації конфігурації та підказок UI конфігурації
- метаданих автентифікації, онбордингу та налаштування (псевдонім, автоувімкнення, змінні середовища провайдера, варіанти автентифікації)
- підказок активації для поверхонь контрольної площини
- скороченого володіння сімействами моделей
- статичних знімків володіння можливостями (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації, специфічних для каналу, що об’єднуються в поверхні каталогу та валідації

**Не використовуйте його для:** реєстрації поведінки під час виконання, оголошення
точок входу коду або метаданих встановлення npm. Це має належати коду вашого Plugin
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
| ------------------------------------ | ----------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний ідентифікатор Plugin. Саме цей ідентифікатор використовується в `plugins.entries.<id>`.                                                                                                                               |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього Plugin.                                                                                                                                                                              |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований Plugin як увімкнений типово. Опустіть це поле або встановіть будь-яке значення, відмінне від `true`, щоб Plugin лишався вимкненим типово.                                                                  |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі ідентифікатори, які нормалізуються до цього канонічного ідентифікатора Plugin.                                                                                                                                         |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Ідентифікатори провайдерів, які мають автоматично вмикати цей Plugin, коли на них посилаються auth, config або model refs.                                                                                                      |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип Plugin, який використовується `plugins.slots.*`.                                                                                                                                                       |
| `channels`                           | Ні          | `string[]`                       | Ідентифікатори каналів, якими володіє цей Plugin. Використовується для виявлення та валідації конфігурації.                                                                                                                     |
| `providers`                          | Ні          | `string[]`                       | Ідентифікатори провайдерів, якими володіє цей Plugin.                                                                                                                                                                             |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Полегшений шлях до модуля виявлення провайдера, відносний до кореня Plugin, для метаданих каталогу провайдерів у межах маніфесту, які можна завантажити без активації повного середовища виконання Plugin.                    |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейства моделей, якими володіє маніфест, що використовуються для автозавантаження Plugin до запуску середовища виконання.                                                                                  |
| `modelCatalog`                       | Ні          | `object`                         | Декларативні метадані каталогу моделей для провайдерів, якими володіє цей Plugin. Це контракт контрольної площини для майбутнього доступного лише для читання переліку, онбордингу, засобів вибору моделей, псевдонімів і придушення без завантаження середовища виконання Plugin. |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані хостів/baseUrl кінцевих точок, якими володіє маніфест, для маршрутів провайдера, які ядро має класифікувати до завантаження середовища виконання провайдера.                                                          |
| `cliBackends`                        | Ні          | `string[]`                       | Ідентифікатори backend CLI inference, якими володіє цей Plugin. Використовуються для автоактивації під час запуску на основі явних config refs.                                                                                 |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на провайдер або backend CLI, для яких слід перевіряти синтетичний hook auth, що належить Plugin, під час холодного виявлення моделей до завантаження середовища виконання.                                          |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API key, якими володіє вбудований Plugin і які представляють несекретний локальний стан, стан OAuth або облікові дані ambient.                                                                            |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, якими володіє цей Plugin і які мають видавати діагностику config та CLI з урахуванням Plugin до завантаження середовища виконання.                                                                               |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Застарілі сумісні метадані env для пошуку auth/status провайдера. Для нових Plugin віддавайте перевагу `setup.providers[].envVars`; OpenClaw і далі читає це поле протягом періоду знецінення.                                 |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Ідентифікатори провайдерів, які мають повторно використовувати інший ідентифікатор провайдера для пошуку auth, наприклад провайдер кодування, який використовує той самий API key базового провайдера та auth-profile.        |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Полегшені метадані env каналу, які OpenClaw може перевіряти без завантаження коду Plugin. Використовуйте це для налаштування каналів через env або поверхонь auth, які мають бачити типові допоміжні засоби запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Полегшені метадані варіантів auth для засобів вибору під час онбордингу, визначення пріоритетного провайдера та простого зв’язування прапорців CLI.                                                                             |
| `activation`                         | Ні          | `object`                         | Полегшені метадані планувальника активації для завантаження за тригерами провайдера, команди, каналу, маршруту та можливостей. Лише метадані; фактичною поведінкою під час виконання, як і раніше, володіє середовище виконання Plugin. |
| `setup`                              | Ні          | `object`                         | Полегшені дескриптори setup/onboarding, які поверхні виявлення та налаштування можуть перевіряти без завантаження середовища виконання Plugin.                                                                                  |
| `qaRunners`                          | Ні          | `object[]`                       | Полегшені дескриптори QA runner, які використовує спільний хост `openclaw qa` до завантаження середовища виконання Plugin.                                                                                                      |
| `contracts`                          | Ні          | `object`                         | Статичний знімок вбудованих можливостей для зовнішніх hook auth, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння інструментами. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Полегшені типові значення media-understanding для ідентифікаторів провайдерів, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                            |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації каналу, якими володіє маніфест і які об’єднуються в поверхні виявлення та валідації до завантаження середовища виконання.                                                                                 |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносні до кореня Plugin.                                                                                                                                                                      |
| `name`                               | Ні          | `string`                         | Людинозрозуміла назва Plugin.                                                                                                                                                                                                     |
| `description`                        | Ні          | `string`                         | Короткий опис, що показується в поверхнях Plugin.                                                                                                                                                                                 |
| `version`                            | Ні          | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | Ні          | `Record<string, object>`         | Мітки UI, placeholders і підказки щодо чутливості для полів конфігурації.                                                                                                                                                        |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або auth.
OpenClaw зчитує це до завантаження середовища виконання провайдера.
Потік налаштування провайдера віддає перевагу цим варіантам із маніфесту, а потім, для сумісності, повертається до метаданих wizard під час виконання
та варіантів каталогу встановлення.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                          |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Ідентифікатор провайдера, до якого належить цей варіант.                                                 |
| `method`              | Так         | `string`                                        | Ідентифікатор методу auth, до якого треба спрямувати обробку.                                            |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор варіанта auth, який використовується в потоках онбордингу та CLI.              |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо пропущено, OpenClaw використовує `choiceId`.                                 |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для засобу вибору.                                                             |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних засобах вибору, керованих асистентом.                  |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант із засобів вибору асистента, але залишає доступним ручний вибір через CLI.             |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори варіантів, які мають перенаправляти користувачів на цей варіант-заміну.        |
| `groupId`             | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для групування пов’язаних варіантів.                                  |
| `groupLabel`          | Ні          | `string`                                        | Мітка цієї групи для користувача.                                                                        |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                     |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків auth з одним прапорцем.                                    |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                    |
| `cliOption`           | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                                 |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з’являтися цей варіант. Якщо пропущено, типово використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли Plugin володіє ім’ям команди, яке користувачі можуть
помилково додати в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw
використовує ці метадані для діагностики без імпорту коду середовища виконання Plugin.

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
| `name`       | Так         | `string`          | Ім’я команди, що належить цьому Plugin.                                    |
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не кореневу команду CLI.       |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід пропонувати для операцій CLI, якщо вона існує. |

## Довідник `activation`

Використовуйте `activation`, коли Plugin може дешево оголосити, які події
контрольної площини мають включати його до плану активації/завантаження.

Цей блок — метадані планувальника, а не API життєвого циклу. Він не реєструє
поведінку під час виконання, не замінює `register(...)` і не гарантує, що
код Plugin уже було виконано. Планувальник активації використовує ці поля, щоб
звузити набір кандидатів Plugin перед поверненням до наявних метаданих володіння маніфесту,
таких як `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools` і hooks.

Надавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте
`providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`,
коли ці поля виражають зв’язок. Використовуйте `activation` для додаткових підказок планувальнику,
які не можна подати через ці поля володіння.

Цей блок містить лише метадані. Він не реєструє поведінку під час виконання і не
замінює `register(...)`, `setupEntry` або інші runtime/plugin entrypoints.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням Plugin, тому
відсутність метаданих активації зазвичай лише погіршує продуктивність; вона не має
змінювати коректність, доки ще існують застарілі fallback на володіння маніфестом.

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
| `onProviders`    | Ні          | `string[]`                                           | Ідентифікатори провайдерів, які мають включати цей Plugin до планів активації/завантаження.            |
| `onCommands`     | Ні          | `string[]`                                           | Ідентифікатори команд, які мають включати цей Plugin до планів активації/завантаження.                 |
| `onChannels`     | Ні          | `string[]`                                           | Ідентифікатори каналів, які мають включати цей Plugin до планів активації/завантаження.                |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають включати цей Plugin до планів активації/завантаження.                        |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки можливостей, що використовуються плануванням активації контрольної площини. За можливості віддавайте перевагу вужчим полям. |

Поточні активні споживачі:

- планування CLI, запущене командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/каналу, запущене каналом, повертається до застарілого володіння `channels[]`,
  коли явні метадані активації каналу відсутні
- планування setup/runtime, запущене провайдером, повертається до застарілого
  володіння `providers[]` і верхньорівневого `cliBackends[]`, коли явні метадані активації провайдера
  відсутні

Діагностика планувальника може розрізняти явні підказки активації та fallback на
володіння маніфестом. Наприклад, `activation-command-hint` означає, що
збіглося `activation.onCommands`, а `manifest-command-alias` означає, що
планувальник натомість використав володіння `commandAliases`. Ці мітки причин призначені для
діагностики хоста й тестів; авторам Plugin слід і далі оголошувати метадані,
які найкраще описують володіння.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли Plugin додає один або кілька transport runners під
спільним коренем `openclaw qa`. Зберігайте ці метадані легкими та статичними; фактичною
реєстрацією CLI під час виконання, як і раніше, володіє
полегшена поверхня `runtime-api.ts`, що експортує `qaRunnerCliRegistrations`.

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

| Поле          | Обов’язкове | Тип      | Що воно означає                                                     |
| ------------- | ----------- | -------- | ------------------------------------------------------------------- |
| `commandName` | Так         | `string` | Підкоманда, змонтована під `openclaw qa`, наприклад `matrix`.       |
| `description` | Ні          | `string` | Резервний текст довідки, що використовується, коли спільному хосту потрібна stub-команда. |

## Довідник `setup`

Використовуйте `setup`, коли поверхням setup та onboarding потрібні легкі метадані Plugin,
якими Plugin володіє, до завантаження середовища виконання.

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

Верхньорівневий `cliBackends` залишається чинним і далі описує backend CLI inference.
`setup.cliBackends` — це поверхня дескрипторів, специфічна для setup, для
потоків контрольної площини/setup, які мають залишатися лише на рівні метаданих.

Якщо вони присутні, `setup.providers` і `setup.cliBackends` є бажаною
поверхнею пошуку descriptor-first для виявлення setup. Якщо дескриптор лише
звужує набір кандидатів Plugin, а setup все одно потребує багатших runtime hooks під час налаштування,
встановіть `requiresRuntime: true` і залиште `setup-api` як
резервний шлях виконання.

OpenClaw також включає `setup.providers[].envVars` у типові пошуки auth провайдера та
змінних середовища. `providerAuthEnvVars` і далі підтримується через адаптер сумісності
протягом періоду знецінення, але небудовані Plugin, які все ще його використовують,
отримують діагностику маніфесту. Нові Plugin мають розміщувати метадані env setup/status
у `setup.providers[].envVars`.

OpenClaw також може виводити прості варіанти setup з `setup.providers[].authMethods`,
коли запис setup недоступний або коли `setup.requiresRuntime: false`
означає, що runtime setup не потрібне. Явні записи `providerAuthChoices` і далі мають перевагу
для власних міток, прапорців CLI, області онбордингу та метаданих асистента.

Установлюйте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для
поверхні setup. OpenClaw трактує явне `false` як контракт лише на рівні дескриптора
і не виконуватиме `setup-api` або `openclaw.setupEntry` для пошуку setup. Якщо
Plugin лише з дескрипторами все ж постачає один із цих runtime entrypoints setup,
OpenClaw повідомляє додаткову діагностику й продовжує його ігнорувати. Пропущене
`requiresRuntime` зберігає застарілу поведінку fallback, щоб наявні Plugin, які додали
дескриптори без цього прапорця, не ламалися.

Оскільки пошук setup може виконувати код `setup-api`, яким володіє Plugin,
нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними
серед виявлених Plugin. Неоднозначне володіння завершується безпечною відмовою, а не вибором
переможця за порядком виявлення.

Коли runtime setup все ж виконується, діагностика реєстру setup повідомляє про дрейф дескриптора, якщо
`setup-api` реєструє провайдера або backend CLI, якого не оголошують дескриптори маніфесту,
або якщо для дескриптора немає відповідної runtime-реєстрації. Ці діагностики є додатковими
і не відхиляють застарілі Plugin.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                       |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | Ідентифікатор провайдера, що відкривається під час setup або onboarding. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Ідентифікатори методів setup/auth, які підтримує цей провайдер без завантаження повного runtime. |
| `envVars`     | Ні          | `string[]` | Змінні середовища, які типові поверхні setup/status можуть перевіряти до завантаження runtime Plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                     |
| ------------------ | ----------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup провайдерів, доступні під час setup та onboarding.                                |
| `cliBackends`      | Ні          | `string[]` | Ідентифікатори backend для часу setup, що використовуються для descriptor-first пошуку setup. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Ідентифікатори міграцій конфігурації, якими володіє поверхня setup цього Plugin.                    |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескриптором.                               |

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

| Поле          | Тип        | Що воно означає                        |
| ------------- | ---------- | -------------------------------------- |
| `label`       | `string`   | Мітка поля для користувача.            |
| `help`        | `string`   | Короткий допоміжний текст.             |
| `tags`        | `string[]` | Необов’язкові UI-теги.                 |
| `advanced`    | `boolean`  | Позначає поле як розширене.            |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе. |
| `placeholder` | `string`   | Текст placeholder для полів форми.     |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
зчитати без імпорту runtime Plugin.

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
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

Кожен список необов’язковий:

| Поле                             | Тип        | Що воно означає                                                         |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ідентифікатори фабрик розширень app-server Codex, наразі `codex-app-server`. |
| `agentToolResultMiddleware`      | `string[]` | Ідентифікатори runtime, для яких вбудований Plugin може зареєструвати middleware результатів інструментів. |
| `externalAuthProviders`          | `string[]` | Ідентифікатори провайдерів, hook зовнішнього auth-profile яких належить цьому Plugin. |
| `speechProviders`                | `string[]` | Ідентифікатори speech-провайдерів, якими володіє цей Plugin.            |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори провайдерів realtime-transcription, якими володіє цей Plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори провайдерів realtime-voice, якими володіє цей Plugin.    |
| `memoryEmbeddingProviders`       | `string[]` | Ідентифікатори провайдерів memory embedding, якими володіє цей Plugin.  |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори провайдерів media-understanding, якими володіє цей Plugin. |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори провайдерів image-generation, якими володіє цей Plugin.  |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори провайдерів video-generation, якими володіє цей Plugin.  |
| `webFetchProviders`              | `string[]` | Ідентифікатори провайдерів web-fetch, якими володіє цей Plugin.         |
| `webSearchProviders`             | `string[]` | Ідентифікатори провайдерів web search, якими володіє цей Plugin.        |
| `tools`                          | `string[]` | Назви інструментів агента, якими володіє цей Plugin, для перевірок вбудованих контрактів. |

`contracts.embeddedExtensionFactories` збережено для фабрик розширень лише для вбудованого
app-server Codex. Вбудовані перетворення результатів інструментів повинні
оголошувати `contracts.agentToolResultMiddleware` і реєструватися через
`api.registerAgentToolResultMiddleware(...)`. Зовнішні Plugin не можуть
реєструвати middleware результатів інструментів, оскільки цей шов може переписувати високодовірений вивід інструмента
до того, як його побачить модель.

Plugin провайдерів, що реалізують `resolveExternalAuthProfiles`, повинні оголошувати
`contracts.externalAuthProviders`. Plugin без цього оголошення все ще працюють
через застарілий fallback сумісності, але цей fallback повільніший
і буде вилучений після завершення вікна міграції.

Вбудовані провайдери memory embedding повинні оголошувати
`contracts.memoryEmbeddingProviders` для кожного ідентифікатора адаптера, який вони відкривають, включно з
вбудованими адаптерами, такими як `local`. Окремі шляхи CLI використовують цей контракт маніфесту,
щоб завантажувати лише Plugin-власника до того, як повне runtime Gateway
зареєструє провайдерів.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли провайдер media-understanding має
типові моделі, пріоритет fallback для автоauth або підтримку нативних документів, які
типовим допоміжним засобам ядра потрібні до завантаження runtime. Ключі також мають бути оголошені в
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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіаможливості, які відкриває цей провайдер.                                |
| `defaultModels`        | `Record<string, string>`            | Типові значення зіставлення можливості з моделлю, які використовуються, коли в конфігурації не вказано модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного fallback провайдера на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні входи документів, які підтримує провайдер.                           |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли Plugin каналу потребує легких метаданих конфігурації до
завантаження runtime. Виявлення setup/status каналу лише для читання може використовувати ці метадані
безпосередньо для налаштованих зовнішніх каналів, коли запис setup недоступний або
коли `setup.requiresRuntime: false` означає, що runtime setup не потрібне.

`channelConfigs` — це метадані маніфесту Plugin, а не новий верхньорівневий розділ користувацької
конфігурації. Користувачі, як і раніше, налаштовують екземпляри каналів у `channels.<channel-id>`.
OpenClaw зчитує метадані маніфесту, щоб визначити, який Plugin володіє цим налаштованим
каналом, до виконання runtime-коду Plugin.

Для Plugin каналу `configSchema` і `channelConfigs` описують різні
шляхи:

- `configSchema` валідує `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` валідує `channels.<channel-id>`

Небудовані Plugin, які оголошують `channels[]`, також повинні оголошувати відповідні
записи `channelConfigs`. Без них OpenClaw все ще може завантажити Plugin, але
поверхні схем конфігурації cold-path, setup і Control UI не знатимуть форму параметрів,
якими володіє канал, доки не виконається runtime Plugin.

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

| Поле          | Тип                      | Що воно означає                                                                            |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкова для кожного оголошеного запису конфігурації каналу. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/placeholders/підказки чутливості для цього розділу конфігурації каналу. |
| `label`       | `string`                 | Мітка каналу, що об’єднується в поверхні вибору та перевірки, коли runtime-метадані ще не готові. |
| `description` | `string`                 | Короткий опис каналу для поверхонь перевірки та каталогу.                                  |
| `preferOver`  | `string[]`               | Ідентифікатори застарілих або менш пріоритетних Plugin, які цей канал має випереджати в поверхнях вибору. |

### Заміна іншого Plugin каналу

Використовуйте `preferOver`, коли ваш Plugin є пріоритетним власником для ідентифікатора каналу, який
також може надавати інший Plugin. Типові випадки: перейменований ідентифікатор Plugin,
окремий Plugin, який замінює вбудований Plugin, або супроводжуваний fork, що
зберігає той самий ідентифікатор каналу для сумісності конфігурації.

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

Коли налаштовано `channels.chat`, OpenClaw враховує і ідентифікатор каналу, і
ідентифікатор пріоритетного Plugin. Якщо менш пріоритетний Plugin було вибрано лише тому, що
він є вбудованим або ввімкненим типово, OpenClaw вимикає його в фактичній
runtime-конфігурації, щоб один Plugin володів каналом і його інструментами. Явний
вибір користувача все одно має перевагу: якщо користувач явно вмикає обидва Plugin, OpenClaw
зберігає цей вибір і повідомляє про діагностику дубльованого каналу/інструмента замість
тихо змінювати запитаний набір Plugin.

Застосовуйте `preferOver` лише до ідентифікаторів Plugin, які справді можуть надавати той самий канал.
Це не загальне поле пріоритету, і воно не перейменовує ключі користувацької конфігурації.

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш Plugin провайдера з
скорочених ідентифікаторів моделей на кшталт `gpt-5.5` або `claude-sonnet-4.6` до завантаження runtime Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий пріоритет:

- явні посилання `provider/model` використовують метадані маніфесту `providers` власника
- `modelPatterns` мають вищий пріоритет за `modelPrefixes`
- якщо збігаються один небудований Plugin і один вбудований Plugin, перемагає небудований
  Plugin
- решта неоднозначностей ігнорується, доки користувач або конфігурація не вкаже провайдера

Поля:

| Поле            | Тип        | Що воно означає                                                              |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими ідентифікаторами моделей. |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими ідентифікаторами моделей після видалення суфікса profile. |

## Довідник `modelCatalog`

Використовуйте `modelCatalog`, коли OpenClaw має знати метадані моделей провайдера до
завантаження runtime Plugin. Це джерело, яким володіє маніфест, для фіксованих
рядків каталогу, псевдонімів провайдерів, правил придушення та режиму виявлення.
Оновлення під час виконання, як і раніше, належить runtime-коду провайдера, але
маніфест повідомляє ядру, коли потрібне runtime.

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
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

Поля верхнього рівня:

| Поле           | Тип                                                      | Що воно означає                                                                                           |
| -------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | Рядки каталогу для ідентифікаторів провайдерів, якими володіє цей Plugin. Ключі також мають з’являтися у верхньорівневому `providers`. |
| `aliases`      | `Record<string, object>`                                 | Псевдоніми провайдерів, які мають розв’язуватися до провайдера-власника для планування каталогу або придушення. |
| `suppressions` | `object[]`                                               | Рядки моделей з іншого джерела, які цей Plugin придушує з причини, специфічної для провайдера.           |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Чи можна читати каталог провайдера з метаданих маніфесту, оновлювати в кеш або для нього потрібне runtime. |

Поля провайдера:

| Поле      | Тип                      | Що воно означає                                                    |
| --------- | ------------------------ | ------------------------------------------------------------------ |
| `baseUrl` | `string`                 | Необов’язковий типовий base URL для моделей у каталозі цього провайдера. |
| `api`     | `ModelApi`               | Необов’язковий типовий адаптер API для моделей у каталозі цього провайдера. |
| `headers` | `Record<string, string>` | Необов’язкові статичні заголовки, що застосовуються до каталогу цього провайдера. |
| `models`  | `object[]`               | Обов’язкові рядки моделей. Рядки без `id` ігноруються.             |

Поля моделі:

| Поле            | Тип                                                            | Що воно означає                                                              |
| --------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Локальний для провайдера ідентифікатор моделі без префікса `provider/`.      |
| `name`          | `string`                                                       | Необов’язкова відображувана назва.                                           |
| `api`           | `ModelApi`                                                     | Необов’язкове перевизначення API для окремої моделі.                         |
| `baseUrl`       | `string`                                                       | Необов’язкове перевизначення base URL для окремої моделі.                    |
| `headers`       | `Record<string, string>`                                       | Необов’язкові статичні заголовки для окремої моделі.                         |
| `input`         | `Array<"text" \| "image" \| "document">`                       | Модальності, які приймає модель.                                             |
| `reasoning`     | `boolean`                                                      | Чи відкриває модель поведінку reasoning.                                     |
| `contextWindow` | `number`                                                       | Нативне вікно контексту провайдера.                                          |
| `contextTokens` | `number`                                                       | Необов’язкове ефективне обмеження контексту під час виконання, якщо воно відрізняється від `contextWindow`. |
| `maxTokens`     | `number`                                                       | Максимальна кількість вихідних токенів, якщо відома.                         |
| `cost`          | `object`                                                       | Необов’язкова ціна в USD за мільйон токенів, включно з необов’язковим `tieredPricing`. |
| `compat`        | `object`                                                       | Необов’язкові прапорці сумісності, що відповідають сумісності конфігурації моделі OpenClaw. |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | Статус у списку. Використовуйте придушення лише тоді, коли рядок взагалі не має з’являтися. |
| `statusReason`  | `string`                                                       | Необов’язкова причина, що показується для статусу, відмінного від доступного. |
| `replaces`      | `string[]`                                                     | Старі локальні для провайдера ідентифікатори моделей, які ця модель замінює. |
| `replacedBy`    | `string`                                                       | Ідентифікатор локальної для провайдера моделі-заміни для застарілих рядків.  |
| `tags`          | `string[]`                                                     | Стабільні теги, що використовуються засобами вибору та фільтрами.            |

Не додавайте до `modelCatalog` дані лише для runtime. Якщо провайдеру потрібен стан
облікового запису, API-запит або виявлення локального процесу, щоб знати повний
набір моделей, оголосіть цього провайдера як `refreshable` або `runtime` у `discovery`.

### Індекс провайдерів OpenClaw

Індекс провайдерів OpenClaw — це preview-метадані, якими володіє OpenClaw, для провайдерів,
чиї Plugin можуть бути ще не встановлені. Він не є частиною маніфесту Plugin.
Маніфести Plugin залишаються авторитетним джерелом для встановлених Plugin. Індекс провайдерів — це
внутрішній контракт fallback, який у майбутньому використовуватимуть поверхні встановлюваних провайдерів
і засоби вибору моделей до встановлення, коли Plugin провайдера не встановлений.

Порядок авторитетності каталогу:

1. Конфігурація користувача.
2. `modelCatalog` маніфесту встановленого Plugin.
3. Кеш каталогу моделей після явного оновлення.
4. Preview-рядки індексу провайдерів OpenClaw.

Індекс провайдерів не повинен містити секретів, стану ввімкнення, runtime hooks або
живих даних моделей, специфічних для облікового запису. Його preview-каталоги використовують ту саму
форму рядка провайдера `modelCatalog`, що й маніфести Plugin, але мають лишатися обмеженими
стабільними метаданими відображення, якщо тільки такі поля runtime-адаптера, як `api`,
`baseUrl`, ціни або прапорці сумісності, навмисно не узгоджені з
маніфестом встановленого Plugin. Провайдери з живим виявленням `/models` повинні
записувати оновлені рядки через явний шлях кешу каталогу моделей замість того,
щоб робити звичайні виклики API провайдера під час стандартного виведення списку або онбордингу.

Застарілі верхньорівневі ключі можливостей більше не рекомендуються. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` під `contracts`; звичайне
завантаження маніфесту більше не трактує ці верхньорівневі поля як володіння
можливостями.

## Маніфест порівняно з package.json

Ці два файли виконують різні завдання:

| Файл                   | Використовуйте для                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідації конфігурації, метаданих варіантів auth і підказок UI, які мають існувати до запуску коду Plugin          |
| `package.json`         | Метаданих npm, встановлення залежностей і блока `openclaw`, що використовується для entrypoints, контролю встановлення, setup або метаданих каталогу |

Якщо ви не впевнені, куди належить певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw має знати це до завантаження коду Plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів входу або поведінки встановлення npm, помістіть це в `package.json`

### Поля `package.json`, що впливають на виявлення

Деякі метадані Plugin до runtime навмисно зберігаються в `package.json` під
блоком `openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                     |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує entrypoints нативного Plugin. Має залишатися в межах каталогу пакета Plugin.                                                                                              |
| `openclaw.runtimeExtensions`                                      | Оголошує entrypoints built JavaScript runtime для встановлених пакетів. Має залишатися в межах каталогу пакета Plugin.                                                            |
| `openclaw.setupEntry`                                             | Полегшений entrypoint лише для setup, який використовується під час онбордингу, відкладеного запуску каналу та виявлення channel status/SecretRef лише для читання. Має залишатися в межах каталогу пакета Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує built JavaScript entrypoint setup для встановлених пакетів. Має залишатися в межах каталогу пакета Plugin.                                                               |
| `openclaw.channel`                                                | Полегшені метадані каталогу каналів, наприклад мітки, шляхи документації, псевдоніми та текст для вибору.                                                                          |
| `openclaw.channel.configuredState`                                | Полегшені метадані перевірки configured-state, які можуть відповісти на запитання «чи вже існує setup лише через env?» без завантаження повного runtime каналу.                  |
| `openclaw.channel.persistedAuthState`                             | Полегшені метадані перевірки persisted-auth, які можуть відповісти на запитання «чи вже є будь-що, що ввійшло в систему?» без завантаження повного runtime каналу.              |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для вбудованих і зовнішньо опублікованих Plugin.                                                                                                   |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                               |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw із використанням нижньої межі semver, наприклад `>=2026.3.22`.                                                                     |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення й оновлення перевіряють отриманий артефакт щодо нього.                                         |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення перевстановлення вбудованого Plugin, коли конфігурація недійсна.                                                                                 |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням каналу лише для setup завантажуватися до повного Plugin каналу під час запуску.                                                                                 |

Метадані маніфесту визначають, які варіанти provider/channel/setup з’являються в
онбордингу до завантаження runtime. `package.json#openclaw.install` повідомляє
онбордингу, як отримати або ввімкнути цей Plugin, коли користувач вибирає один із цих
варіантів. Не переносіть підказки встановлення до `openclaw.plugin.json`.

`openclaw.install.minHostVersion` перевіряється під час встановлення та
завантаження реєстру маніфестів. Недійсні значення відхиляються; новіші, але чинні значення пропускають
Plugin на старіших хостах.

Точне закріплення версії npm уже міститься в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього каталогу
мають поєднувати точні специфікації з `expectedIntegrity`, щоб потоки оновлення безпечно
завершувалися з помилкою, якщо отриманий артефакт npm більше не відповідає закріпленому релізу.
Інтерактивний онбординг і далі пропонує надійні npm-специфікації реєстру, включно з голими
іменами пакетів і dist-tags, для сумісності. Діагностика каталогу може
розрізняти точні, плаваючі, закріплені за цілісністю, без цілісності, з невідповідністю імені пакета та недійсні джерела default-choice. Вона також попереджає, коли
`expectedIntegrity` присутній, але немає чинного джерела npm, яке він може закріпити.
Коли `expectedIntegrity` присутній,
потоки встановлення/оновлення забезпечують його перевірку; коли його пропущено, розв’язання реєстру
фіксується без закріплення цілісності.

Plugin каналів повинні надавати `openclaw.setupEntry`, коли status, список каналів
або сканування SecretRef мають визначати налаштовані облікові записи без завантаження повного
runtime. Запис setup має відкривати метадані каналу разом із безпечними для setup адаптерами
config, status і secrets; мережеві клієнти, слухачі gateway і transport runtime
слід залишати в основному entrypoint розширення.

Поля runtime entrypoint не перевизначають перевірки меж пакета для
полів source entrypoint. Наприклад, `openclaw.runtimeExtensions` не може зробити
завантажуваним шлях `openclaw.extensions`, що виходить за межі пакета.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він
не робить довільно зламані конфігурації придатними для встановлення. Сьогодні він лише дозволяє потокам встановлення
відновлюватися після конкретних застарілих збоїв оновлення вбудованого Plugin, таких як
відсутній шлях до вбудованого Plugin або застарілий запис `channels.<id>` для цього ж
вбудованого Plugin. Несуміжні помилки конфігурації, як і раніше, блокують встановлення і відправляють операторів
до `openclaw doctor --fix`.

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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна дешева перевірка auth
типу так/ні до завантаження повного Plugin каналу. Цільовий export має бути невеликою
функцією, яка читає лише збережений стан; не спрямовуйте її через повний barrel runtime
каналу.

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

Використовуйте це, коли канал може визначати configured-state з env або інших малих
нерuntime-входів. Якщо перевірка потребує повного розв’язання конфігурації або справжнього
runtime каналу, залишайте цю логіку в hook `config.hasConfiguredState` Plugin.

## Пріоритет виявлення (дубльовані ідентифікатори Plugin)

OpenClaw виявляє Plugin з кількох коренів (вбудовані, глобальне встановлення, workspace, явні шляхи, вибрані конфігурацією). Якщо два виявлення мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються, а не завантажуються поруч із ним.

Пріоритет від найвищого до найнижчого:

1. **Вибраний конфігурацією** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — Plugin, що постачаються з OpenClaw
3. **Глобальне встановлення** — Plugin, встановлені в глобальний корінь Plugin OpenClaw
4. **Workspace** — Plugin, виявлені відносно поточного workspace

Наслідки:

- Fork або застаріла копія вбудованого Plugin, що лежить у workspace, не перекриє вбудовану збірку.
- Щоб справді перевизначити вбудований Plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтесь на виявлення у workspace.
- Відкидання дублікатів журналюється, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен Plugin має постачати JSON Schema**, навіть якщо він не приймає конфігурації.
- Порожня схема прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми перевіряються під час читання/запису конфігурації, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки ідентифікатор каналу не оголошено
  в маніфесті Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **виявлювані** ідентифікатори Plugin. Невідомі ідентифікатори — це **помилки**.
- Якщо Plugin встановлений, але має зламаний або відсутній маніфест чи схему,
  валідація завершується помилкою, і Doctor повідомляє про помилку Plugin.
- Якщо конфігурація Plugin існує, але Plugin **вимкнено**, конфігурація зберігається, і
  в Doctor + логах відображається **попередження**.

Повну схему `plugins.*` див. у [Configuration reference](/uk/gateway/configuration).

## Примітки

- Маніфест **обов’язковий для нативних Plugin OpenClaw**, включно із завантаженням із локальної файлової системи. Runtime і далі завантажує модуль Plugin окремо; маніфест використовується лише для виявлення + валідації.
- Нативні маніфести розбираються за допомогою JSON5, тож коментарі, кінцеві коми та ключі без лапок приймаються, якщо кінцеве значення все ще є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте власних верхньорівневих ключів.
- `channels`, `providers`, `cliBackends` і `skills` можна опустити, якщо Plugin їх не потребує.
- `providerDiscoveryEntry` має залишатися легким і не повинен імпортувати широкий runtime-код; використовуйте його для статичних метаданих каталогу провайдера або вузьких дескрипторів виявлення, а не для виконання під час обробки запиту.
- Ексклюзивні типи Plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Метадані змінних середовища (`setup.providers[].envVars`, застарілий `providerAuthEnvVars` і `channelEnvVars`) є лише декларативними. Поверхні status, audit, валідації доставки Cron та інші поверхні лише для читання все одно застосовують довіру до Plugin і політику ефективної активації, перш ніж вважати змінну середовища налаштованою.
- Для метаданих runtime wizard, які потребують коду провайдера, див. [Provider runtime hooks](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш Plugin залежить від нативних модулів, задокументуйте кроки збирання та будь-які вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення Plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з Plugin.
  </Card>
  <Card title="Архітектура Plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель можливостей.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник з SDK Plugin і subpath imports.
  </Card>
</CardGroup>
