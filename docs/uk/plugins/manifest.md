---
read_when:
    - Ви створюєте plugin OpenClaw
    - Вам потрібно постачати схему конфігурації plugin або налагодити помилки валідації plugin
summary: Вимоги до маніфесту Plugin + JSON schema (сувора валідація конфігурації)
title: Маніфест Plugin
x-i18n:
    generated_at: "2026-04-23T05:16:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4da8ce35aca4c12bf49a4c3e352fb7fc2b5768cb34157a00dabd247fe60b4f04
    source_path: plugins/manifest.md
    workflow: 15
---

# Маніфест Plugin (`openclaw.plugin.json`)

Ця сторінка стосується лише **власного маніфесту plugin OpenClaw**.

Сумісні макети пакетів описано в [Plugin bundles](/uk/plugins/bundles).

Сумісні формати пакетів використовують інші файли маніфесту:

- Пакет Codex: `.codex-plugin/plugin.json`
- Пакет Claude: `.claude-plugin/plugin.json` або типовий макет компонента Claude без маніфесту
- Пакет Cursor: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети пакетів, але вони не проходять валідацію за схемою `openclaw.plugin.json`, описаною тут.

Для сумісних пакетів OpenClaw наразі зчитує метадані пакета, а також оголошені корені skill, корені команд Claude, типові значення `settings.json` для пакета Claude, типові значення LSP для пакета Claude та підтримувані набори hook, якщо макет відповідає очікуванням середовища виконання OpenClaw.

Кожен власний plugin OpenClaw **повинен** містити файл `openclaw.plugin.json` у **корені plugin**. OpenClaw використовує цей маніфест для валідації конфігурації **без виконання коду plugin**. Відсутні або невалідні маніфести вважаються помилками plugin і блокують валідацію конфігурації.

Повний посібник із системи plugin дивіться тут: [Plugins](/uk/tools/plugin).
Для власної моделі capability та актуальних рекомендацій щодо зовнішньої сумісності:
[Capability model](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує перед завантаженням коду вашого plugin.

Використовуйте його для:

- ідентичності plugin
- валідації конфігурації
- метаданих auth та onboarding, які мають бути доступні без запуску середовища виконання plugin
- недорогих підказок активації, які можуть перевіряти поверхні control-plane до завантаження середовища виконання
- недорогих дескрипторів налаштування, які можуть перевіряти поверхні setup/onboarding до завантаження середовища виконання
- метаданих псевдонімів та автоувімкнення, які мають визначатися до завантаження середовища виконання plugin
- скорочених метаданих належності до сімейства моделей, які мають автоматично активувати plugin до завантаження середовища виконання
- статичних знімків належності capability, що використовуються для вбудованого wiring сумісності та покриття контрактів
- недорогих метаданих QA runner, які спільний хост `openclaw qa` може перевіряти до завантаження середовища виконання plugin
- метаданих конфігурації, специфічних для channel, які мають об’єднуватися в поверхні каталогу та валідації без завантаження середовища виконання
- підказок для UI конфігурації

Не використовуйте його для:

- реєстрації поведінки середовища виконання
- оголошення code entrypoint
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

| Поле                                 | Обов’язкове | Тип                              | Що воно означає                                                                                                                                                                                              |
| ------------------------------------ | ----------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | Так         | `string`                         | Канонічний ідентифікатор plugin. Саме цей ідентифікатор використовується в `plugins.entries.<id>`.                                                                                                         |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього plugin.                                                                                                                                                        |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований plugin як увімкнений за замовчуванням. Не вказуйте це поле або задайте будь-яке значення, відмінне від `true`, щоб plugin залишався вимкненим за замовчуванням.                       |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі ідентифікатори, які нормалізуються до цього канонічного ідентифікатора plugin.                                                                                                                   |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | Ідентифікатори provider, які мають автоматично вмикати цей plugin, коли auth, конфігурація або посилання на моделі згадують їх.                                                                           |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип plugin, який використовується `plugins.slots.*`.                                                                                                                                  |
| `channels`                           | Ні          | `string[]`                       | Ідентифікатори channel, що належать цьому plugin. Використовуються для виявлення та валідації конфігурації.                                                                                                |
| `providers`                          | Ні          | `string[]`                       | Ідентифікатори provider, що належать цьому plugin.                                                                                                                                                          |
| `modelSupport`                       | Ні          | `object`                         | Скорочені метадані сімейства моделей, що належать маніфесту й використовуються для автоматичного завантаження plugin до запуску середовища виконання.                                                     |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані host/baseUrl для маршрутів provider, що належать маніфесту, які ядро має класифікувати до завантаження середовища виконання provider.                                                            |
| `cliBackends`                        | Ні          | `string[]`                       | Ідентифікатори backend CLI, що належать цьому plugin. Використовуються для автоактивації під час запуску на основі явних посилань у конфігурації.                                                         |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на provider або backend CLI, чиї синтетичні hook auth, що належать plugin, слід перевіряти під час холодного виявлення моделей до завантаження середовища виконання.                           |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API key, що належать вбудованому plugin і позначають несекретний локальний стан облікових даних, OAuth або ambient credentials.                                                      |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, що належать цьому plugin і мають формувати діагностику конфігурації та CLI з урахуванням plugin до завантаження середовища виконання.                                                        |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Недорогі env-метадані auth provider, які OpenClaw може перевіряти без завантаження коду plugin.                                                                                                            |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | Ідентифікатори provider, які мають повторно використовувати інший ідентифікатор provider для пошуку auth, наприклад provider для кодування, який спільно використовує API key і профілі auth базового provider. |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Недорогі env-метадані channel, які OpenClaw може перевіряти без завантаження коду plugin. Використовуйте це для env-керованого налаштування channel або поверхонь auth, які мають бачити загальні помічники запуску/конфігурації. |
| `providerAuthChoices`                | Ні          | `object[]`                       | Недорогі метадані варіантів auth для засобів вибору під час onboarding, визначення бажаного provider і простого зв’язування прапорців CLI.                                                                 |
| `activation`                         | Ні          | `object`                         | Недорогі підказки активації для завантаження, яке запускається provider, командою, channel, маршрутом або capability. Лише метадані; фактичною поведінкою все одно керує середовище виконання plugin.      |
| `setup`                              | Ні          | `object`                         | Недорогі дескриптори setup/onboarding, які поверхні виявлення та налаштування можуть перевіряти без завантаження середовища виконання plugin.                                                              |
| `qaRunners`                          | Ні          | `object[]`                       | Недорогі дескриптори QA runner, які використовує спільний хост `openclaw qa` до завантаження середовища виконання plugin.                                                                                  |
| `contracts`                          | Ні          | `object`                         | Статичний знімок вбудованих capability для мовлення, транскрипції в реальному часі, голосу в реальному часі, розуміння медіа, генерації зображень, генерації музики, генерації відео, web-fetch, вебпошуку та належності інструментів. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Недорогі типові значення розуміння медіа для ідентифікаторів provider, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації channel, що належать маніфесту й об’єднуються в поверхні виявлення та валідації до завантаження середовища виконання.                                                                |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня plugin.                                                                                                                                                   |
| `name`                               | Ні          | `string`                         | Зрозуміла для людини назва plugin.                                                                                                                                                                          |
| `description`                        | Ні          | `string`                         | Короткий опис, що показується в поверхнях plugin.                                                                                                                                                           |
| `version`                            | Ні          | `string`                         | Інформаційна версія plugin.                                                                                                                                                                                 |
| `uiHints`                            | Ні          | `Record<string, object>`         | Мітки UI, заповнювачі та підказки чутливості для полів конфігурації.                                                                                                                                       |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант onboarding або auth.
OpenClaw зчитує це до завантаження середовища виконання provider.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                          |
| --------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | Ідентифікатор provider, якому належить цей варіант.                                                      |
| `method`              | Так         | `string`                                        | Ідентифікатор методу auth, до якого слід спрямувати.                                                     |
| `choiceId`            | Так         | `string`                                        | Стабільний ідентифікатор варіанта auth, який використовується в потоках onboarding і CLI.               |
| `choiceLabel`         | Ні          | `string`                                        | Мітка для користувача. Якщо не вказано, OpenClaw повертається до `choiceId`.                             |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для засобу вибору.                                                             |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних засобах вибору, керованих асистентом.                  |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант у засобах вибору асистента, але все ще дозволяє ручний вибір через CLI.                |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі ідентифікатори варіантів, які мають перенаправляти користувачів до цього варіанта-замінника.  |
| `groupId`             | Ні          | `string`                                        | Необов’язковий ідентифікатор групи для групування пов’язаних варіантів.                                 |
| `groupLabel`          | Ні          | `string`                                        | Мітка цієї групи для користувача.                                                                        |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                     |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків auth з одним прапорцем.                                   |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                    |
| `cliOption`           | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                      |
| `cliDescription`      | Ні          | `string`                                        | Опис, який використовується в довідці CLI.                                                               |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях onboarding має з’являтися цей варіант. Якщо не вказано, типово використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли plugin володіє назвою команди середовища виконання, яку користувачі можуть помилково вказати в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw використовує ці метадані для діагностики без імпорту коду середовища виконання plugin.

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
| `kind`       | Ні          | `"runtime-slash"` | Позначає псевдонім як slash-команду чату, а не кореневу команду CLI.       |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід пропонувати для операцій CLI, якщо така існує. |

## Довідник `activation`

Використовуйте `activation`, коли plugin може дешево оголосити, які події control-plane мають активувати його пізніше.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли plugin додає один або кілька transport runner під спільним коренем `openclaw qa`. Зберігайте ці метадані простими та статичними; фактичною реєстрацією CLI все одно керує середовище виконання plugin через легковагову поверхню `runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

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
| `description` | Ні          | `string` | Резервний текст довідки, який використовується, коли спільному хосту потрібна stub-команда. |

Цей блок містить лише метадані. Він не реєструє поведінку середовища виконання і не замінює `register(...)`, `setupEntry` чи інші entrypoint середовища виконання/plugin.
Поточні споживачі використовують його як підказку для звуження перед ширшим завантаженням plugin, тому відсутність метаданих активації зазвичай впливає лише на продуктивність; це не повинно змінювати коректність, доки ще існують резервні механізми застарілого володіння маніфестом.

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
| `onProviders`    | Ні          | `string[]`                                           | Ідентифікатори provider, які мають активувати цей plugin на запит. |
| `onCommands`     | Ні          | `string[]`                                           | Ідентифікатори команд, які мають активувати цей plugin.          |
| `onChannels`     | Ні          | `string[]`                                           | Ідентифікатори channel, які мають активувати цей plugin.         |
| `onRoutes`       | Ні          | `string[]`                                           | Типи маршрутів, які мають активувати цей plugin.                 |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки capability, що використовуються під час планування активації control-plane. |

Поточні активні споживачі:

- планування CLI, яке запускається командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- планування setup/channel, яке запускається channel, повертається до застарілого володіння `channels[]`, якщо явні метадані активації channel відсутні
- планування setup/runtime, яке запускається provider, повертається до застарілого володіння
  `providers[]` і верхньорівневого `cliBackends[]`, якщо явні метадані активації provider відсутні

## Довідник `setup`

Використовуйте `setup`, коли поверхням setup та onboarding потрібні дешеві метадані plugin до завантаження середовища виконання.

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

Верхньорівневе `cliBackends` залишається валідним і надалі описує backend інференсу CLI. `setup.cliBackends` — це поверхня дескрипторів, специфічна для setup, для потоків control-plane/setup, які мають залишатися лише на рівні метаданих.

Якщо `setup.providers` і `setup.cliBackends` присутні, вони є бажаною поверхнею пошуку setup за принципом descriptor-first. Якщо дескриптор лише звужує кандидатний plugin, а для setup усе ще потрібні багатші hook середовища виконання на етапі setup, установіть `requiresRuntime: true` і залиште `setup-api` як резервний шлях виконання.

Оскільки пошук setup може виконувати код `setup-api`, що належить plugin, нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` повинні залишатися унікальними серед виявлених plugin. Неоднозначне володіння завершується закритою відмовою замість вибору переможця за порядком виявлення.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                      |
| ------------- | ----------- | ---------- | ------------------------------------------------------------------------------------ |
| `id`          | Так         | `string`   | Ідентифікатор provider, який надається під час setup або onboarding. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `authMethods` | Ні          | `string[]` | Ідентифікатори методів setup/auth, які цей provider підтримує без завантаження повного середовища виконання. |
| `envVars`     | Ні          | `string[]` | Env vars, які загальні поверхні setup/status можуть перевіряти до завантаження середовища виконання plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                   |
| ------------------ | ----------- | ---------- | ------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup provider, які надаються під час setup та onboarding.                            |
| `cliBackends`      | Ні          | `string[]` | Ідентифікатори backend для етапу setup, що використовуються для пошуку setup за принципом descriptor-first. Зберігайте нормалізовані ідентифікатори глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | Ідентифікатори міграцій конфігурації, якими володіє поверхня setup цього plugin.                  |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup все ще виконання `setup-api` після пошуку за дескриптором.                      |

## Довідник `uiHints`

`uiHints` — це відображення імен полів конфігурації на невеликі підказки для відображення.

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

Підказка для кожного поля може містити:

| Поле          | Тип        | Що воно означає                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Мітка поля для користувача.             |
| `help`        | `string`   | Короткий допоміжний текст.              |
| `tags`        | `string[]` | Необов’язкові теги UI.                  |
| `advanced`    | `boolean`  | Позначає поле як розширене.             |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.  |
| `placeholder` | `string`   | Текст-заповнювач для полів форми.       |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння capability, які OpenClaw може зчитувати без імпорту середовища виконання plugin.

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

Кожен список є необов’язковим:

| Поле                             | Тип        | Що воно означає                                                       |
| -------------------------------- | ---------- | --------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Ідентифікатори вбудованого середовища виконання, для яких вбудований plugin може реєструвати factory. |
| `speechProviders`                | `string[]` | Ідентифікатори speech provider, якими володіє цей plugin.             |
| `realtimeTranscriptionProviders` | `string[]` | Ідентифікатори provider транскрипції в реальному часі, якими володіє цей plugin. |
| `realtimeVoiceProviders`         | `string[]` | Ідентифікатори provider голосу в реальному часі, якими володіє цей plugin. |
| `mediaUnderstandingProviders`    | `string[]` | Ідентифікатори provider розуміння медіа, якими володіє цей plugin.    |
| `imageGenerationProviders`       | `string[]` | Ідентифікатори provider генерації зображень, якими володіє цей plugin. |
| `videoGenerationProviders`       | `string[]` | Ідентифікатори provider генерації відео, якими володіє цей plugin.    |
| `webFetchProviders`              | `string[]` | Ідентифікатори provider web-fetch, якими володіє цей plugin.          |
| `webSearchProviders`             | `string[]` | Ідентифікатори provider вебпошуку, якими володіє цей plugin.          |
| `tools`                          | `string[]` | Назви agent tool, якими володіє цей plugin для перевірок контрактів вбудованих plugin. |

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли provider розуміння медіа має типові моделі, пріоритет резервного автоauth або нативну підтримку документів, які потрібні загальним допоміжним засобам ядра до завантаження середовища виконання. Ключі також мають бути оголошені в `contracts.mediaUnderstandingProviders`.

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
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Медіа capability, які надає цей provider.                                 |
| `defaultModels`        | `Record<string, string>`            | Типові значення зіставлення capability-модель, які використовуються, коли конфігурація не задає модель. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного резервного вибору provider на основі облікових даних. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні вхідні формати документів, які підтримує provider.                |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли plugin channel потребує дешевих метаданих конфігурації до завантаження середовища виконання.

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
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/заповнювачі/підказки чутливості для цього розділу конфігурації channel. |
| `label`       | `string`                 | Мітка channel, яка об’єднується в поверхні вибору та перевірки, коли метадані середовища виконання ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь перевірки та каталогу.                                      |
| `preferOver`  | `string[]`               | Застарілі або менш пріоритетні ідентифікатори plugin, які цей channel має перевершувати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має визначати ваш provider plugin за скороченими ідентифікаторами моделей на кшталт `gpt-5.4` або `claude-sonnet-4.6` до завантаження середовища виконання plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий пріоритет:

- явні посилання `provider/model` використовують метадані маніфесту `providers`, якому належить provider
- `modelPatterns` мають вищий пріоритет за `modelPrefixes`
- якщо збігаються один невбудований plugin і один вбудований plugin, перемагає невбудований plugin
- інша неоднозначність ігнорується, доки користувач або конфігурація не задасть provider

Поля:

| Поле            | Тип        | Що воно означає                                                              |
| --------------- | ---------- | ---------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, які зіставляються через `startsWith` зі скороченими ідентифікаторами моделей. |
| `modelPatterns` | `string[]` | Джерела regex, які зіставляються зі скороченими ідентифікаторами моделей після видалення суфікса профілю. |

Застарілі верхньорівневі ключі capability більше не рекомендуються. Використовуйте `openclaw doctor --fix`, щоб перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` до `contracts`; звичайне завантаження маніфесту більше не вважає ці верхньорівневі поля володінням capability.

## Маніфест проти package.json

Ці два файли виконують різні завдання:

| Файл                   | Для чого його використовувати                                                                                                      |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів auth і підказки UI, які мають існувати до запуску коду plugin              |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, який використовується для entrypoint, обмежень встановлення, setup або метаданих каталогу |

Якщо ви не впевнені, куди належить певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw повинен знати це до завантаження коду plugin, помістіть це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів entrypoint або поведінки встановлення npm, помістіть це в `package.json`

### Поля package.json, які впливають на виявлення

Деякі метадані plugin до запуску середовища виконання навмисно зберігаються в `package.json` у блоці `openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує entrypoint власних plugin. Має залишатися в каталозі пакета plugin.                                                                                                        |
| `openclaw.runtimeExtensions`                                      | Оголошує entrypoint зібраного JavaScript середовища виконання для встановлених пакетів. Має залишатися в каталозі пакета plugin.                                                   |
| `openclaw.setupEntry`                                             | Легковаговий entrypoint лише для setup, який використовується під час onboarding, відкладеного запуску channel і виявлення channel status/SecretRef у режимі лише читання. Має залишатися в каталозі пакета plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує entrypoint setup зібраного JavaScript для встановлених пакетів. Має залишатися в каталозі пакета plugin.                                                                  |
| `openclaw.channel`                                                | Недорогі метадані каталогу channel, як-от мітки, шляхи до документації, псевдоніми та текст для вибору.                                                                            |
| `openclaw.channel.configuredState`                                | Легковагові метадані перевірки налаштованого стану, які можуть відповісти на питання «чи вже існує налаштування лише через env?» без завантаження повного середовища виконання channel. |
| `openclaw.channel.persistedAuthState`                             | Легковагові метадані перевірки збереженого стану auth, які можуть відповісти на питання «чи вже виконано вхід хоч десь?» без завантаження повного середовища виконання channel.      |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки для встановлення/оновлення вбудованих і зовнішньо опублікованих plugin.                                                                                                    |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw, із нижньою межею semver на кшталт `>=2026.3.22`.                                                                                   |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення та оновлення перевіряють отриманий артефакт за ним.                                              |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення вбудованого plugin, коли конфігурація невалідна.                                                                          |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для setup завантажуватися до повного plugin channel під час запуску.                                                                                |

Метадані маніфесту визначають, які варіанти provider/channel/setup з’являються в onboarding до завантаження середовища виконання. `package.json#openclaw.install` повідомляє onboarding, як отримати або ввімкнути цей plugin, коли користувач вибирає один із цих варіантів. Не переносіть підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення та завантаження реєстру маніфестів. Невалідні значення відхиляються; новіші, але валідні значення пропускають plugin на старіших хостах.

Точне закріплення версії npm уже задається в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Поєднуйте це з
`expectedIntegrity`, якщо хочете, щоб потоки оновлення завершувалися закритою відмовою, коли отриманий npm-артефакт більше не відповідає закріпленому релізу. Інтерактивний onboarding пропонує варіанти встановлення npm із довірених метаданих каталогу лише тоді, коли `npmSpec` є точною версією і присутній `expectedIntegrity`; інакше він повертається до локального джерела або пропуску.

Plugin channel мають надавати `openclaw.setupEntry`, коли status, список channel або сканування SecretRef мають визначати налаштовані облікові записи без завантаження повного середовища виконання. Запис setup має надавати метадані channel разом із безпечними для setup адаптерами конфігурації, status і secrets; клієнти мережі, слухачі Gateway і transport runtime слід залишати в основному entrypoint extension.

Поля entrypoint середовища виконання не скасовують перевірки меж пакета для полів source entrypoint. Наприклад, `openclaw.runtimeExtensions` не може зробити придатним до завантаження шлях `openclaw.extensions`, що виходить за межі.

`openclaw.install.allowInvalidConfigRecovery` навмисно має вузьке призначення. Воно не робить довільно зламані конфігурації придатними до встановлення. Наразі воно лише дозволяє потокам встановлення відновлюватися після конкретних застарілих збоїв оновлення вбудованого plugin, наприклад відсутнього шляху до вбудованого plugin або застарілого запису `channels.<id>` для цього ж вбудованого plugin. Непов’язані помилки конфігурації все одно блокують встановлення і спрямовують операторів до `openclaw doctor --fix`.

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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна дешева yes/no-перевірка auth до завантаження повного plugin channel. Цільовий експорт має бути невеликою функцією, яка читає лише збережений стан; не спрямовуйте її через повний barrel середовища виконання channel.

`openclaw.channel.configuredState` має таку саму форму для дешевих перевірок налаштованого стану лише через env:

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

Використовуйте це, коли channel може визначити configured-state з env або інших малих невиконуваних входів. Якщо перевірка потребує повного визначення конфігурації або справжнього середовища виконання channel, залиште цю логіку в hook `config.hasConfiguredState` plugin.

## Пріоритет виявлення (дублікати ідентифікаторів plugin)

OpenClaw виявляє plugin із кількох коренів (вбудовані, глобальне встановлення, workspace, явно вибрані в конфігурації шляхи). Якщо два виявлення мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч.

Пріоритет від найвищого до найнижчого:

1. **Вибраний у конфігурації** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Вбудований** — plugin, що постачаються з OpenClaw
3. **Глобальне встановлення** — plugin, встановлені в глобальний корінь plugin OpenClaw
4. **Workspace** — plugin, виявлені відносно поточного workspace

Наслідки:

- Форкнута або застаріла копія вбудованого plugin у workspace не замінить вбудовану збірку.
- Щоб справді перевизначити вбудований plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він переміг за пріоритетом, а не покладайтесь на виявлення у workspace.
- Відкидання дублікатів журналюється, щоб Doctor і діагностика запуску могли вказати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен plugin повинен постачатися з JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня схема допустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Схеми проходять валідацію під час читання/запису конфігурації, а не під час виконання.

## Поведінка валідації

- Невідомі ключі `channels.*` — це **помилки**, якщо тільки ідентифікатор channel не оголошений маніфестом plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  повинні посилатися на **виявлювані** ідентифікатори plugin. Невідомі ідентифікатори — це **помилки**.
- Якщо plugin встановлено, але він має зламаний або відсутній маніфест чи схему,
  валідація завершується помилкою, а Doctor повідомляє про помилку plugin.
- Якщо конфігурація plugin існує, але plugin **вимкнений**, конфігурація зберігається і в Doctor + журналах показується **попередження**.

Повну схему `plugins.*` дивіться в [Configuration reference](/uk/gateway/configuration).

## Примітки

- Маніфест є **обов’язковим для власних plugin OpenClaw**, включно із завантаженням із локальної файлової системи.
- Середовище виконання все одно завантажує модуль plugin окремо; маніфест використовується лише для виявлення + валідації.
- Власні маніфести розбираються за допомогою JSON5, тому коментарі, кінцеві коми та ключі без лапок допускаються, якщо кінцеве значення все ще є об’єктом.
- Завантажувач маніфестів читає лише задокументовані поля маніфесту. Уникайте додавання тут власних верхньорівневих ключів.
- `providerAuthEnvVars` — це дешевий шлях метаданих для перевірок auth, валідації env-marker та подібних поверхонь auth provider, які не повинні запускати середовище виконання plugin лише для перевірки назв env.
- `providerAuthAliases` дозволяє варіантам provider повторно використовувати env vars auth, профілі auth, auth на основі конфігурації та варіант onboarding API key іншого provider без жорсткого кодування цього зв’язку в ядрі.
- `providerEndpoints` дозволяє plugin provider володіти простими метаданими зіставлення host/baseUrl endpoint. Використовуйте це лише для класів endpoint, які ядро вже підтримує; поведінкою середовища виконання все одно володіє plugin.
- `syntheticAuthRefs` — це дешевий шлях метаданих для синтетичних hook auth, що належать provider і мають бути видимими для холодного виявлення моделей до існування реєстру середовища виконання. Додавайте лише ті посилання, чий provider середовища виконання або backend CLI справді реалізує `resolveSyntheticAuth`.
- `nonSecretAuthMarkers` — це дешевий шлях метаданих для значень-заповнювачів API key, що належать вбудованим plugin, наприклад маркерів локальних, OAuth або ambient credentials.
  Ядро трактує їх як несекретні для відображення auth і аудиту секретів без жорсткого кодування provider-власника.
- `channelEnvVars` — це дешевий шлях метаданих для резервного використання shell-env, підказок setup та подібних поверхонь channel, які не повинні запускати середовище виконання plugin лише для перевірки назв env. Назви env є метаданими, а не активацією самі по собі: status, аудит, валідація доставки Cron та інші поверхні лише для читання все одно застосовують політику довіри plugin та ефективної активації, перш ніж вважати env var налаштованим channel.
- `providerAuthChoices` — це дешевий шлях метаданих для засобів вибору варіантів auth,
  визначення `--auth-choice`, зіставлення бажаного provider і простої реєстрації прапорців CLI onboarding до завантаження середовища виконання provider. Для метаданих wizard середовища виконання, які потребують коду provider, див.
  [Provider runtime hooks](/uk/plugins/architecture#provider-runtime-hooks).
- Ексклюзивні типи plugin вибираються через `plugins.slots.*`.
  - `kind: "memory"` вибирається через `plugins.slots.memory`.
  - `kind: "context-engine"` вибирається через `plugins.slots.contextEngine`
    (типово: вбудований `legacy`).
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо plugin їх не потребує.
- Якщо ваш plugin залежить від нативних модулів, задокументуйте кроки збирання та будь-які вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Пов’язані матеріали

- [Building Plugins](/uk/plugins/building-plugins) — початок роботи з plugin
- [Plugin Architecture](/uk/plugins/architecture) — внутрішня архітектура
- [SDK Overview](/uk/plugins/sdk-overview) — довідник SDK Plugin
