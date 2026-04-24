---
read_when:
    - Ви створюєте Plugin для OpenClaw
    - Вам потрібно надати schema конфігурації Plugin або налагодити помилки валідації Plugin
summary: Вимоги до маніфесту Plugin та JSON schema (сувора валідація конфігурації)
title: маніфест Plugin
x-i18n:
    generated_at: "2026-04-24T22:21:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddabd562db22a82ff9c46094248350ac30565c9c10c9d87d3c0e85d49e7044a9
    source_path: plugins/manifest.md
    workflow: 15
---

Ця сторінка призначена лише для **власного маніфесту Plugin OpenClaw**.

Сумісні компонування bundle дивіться в [Plugin bundles](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` або стандартне компонування компонентів Claude без маніфесту
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw також автоматично визначає ці компонування bundle, але вони не проходять валідацію за schema `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі зчитує метадані bundle, а також оголошені корені skills, корені команд Claude, типові значення `settings.json` для Claude bundle, типові значення LSP для Claude bundle і підтримувані набори hook, коли компонування відповідає очікуванням середовища виконання OpenClaw.

Кожен власний Plugin OpenClaw **повинен** містити файл `openclaw.plugin.json` у **корені Plugin**. OpenClaw використовує цей маніфест для валідації конфігурації **без виконання коду Plugin**. Відсутні або некоректні маніфести вважаються помилками Plugin і блокують валідацію конфігурації.

Дивіться повний посібник по системі Plugin: [Plugins](/uk/tools/plugin).
Щодо власної моделі capability та поточних рекомендацій із зовнішньої сумісності:
[Модель capability](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує **до завантаження коду вашого Plugin**. Усе нижче має бути достатньо легким для перевірки без запуску runtime Plugin.

**Використовуйте його для:**

- ідентичності Plugin, валідації конфігурації та підказок для UI конфігурації
- метаданих auth, onboarding і setup (alias, auto-enable, змінні середовища provider, варіанти auth)
- підказок активації для поверхонь control plane
- скороченого володіння model-family
- статичних знімків володіння capability (`contracts`)
- метаданих QA runner, які може перевіряти спільний хост `openclaw qa`
- метаданих конфігурації для конкретних channel, що об’єднуються в поверхні каталогу та валідації

**Не використовуйте його для:** реєстрації поведінки runtime, оголошення code entrypoint або метаданих встановлення npm. Це належить до коду вашого Plugin і `package.json`.

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
| `id`                                 | Так         | `string`                         | Канонічний id Plugin. Це id, що використовується в `plugins.entries.<id>`.                                                                                                                                                       |
| `configSchema`                       | Так         | `object`                         | Вбудована JSON Schema для конфігурації цього Plugin.                                                                                                                                                                             |
| `enabledByDefault`                   | Ні          | `true`                           | Позначає вбудований Plugin як увімкнений типово. Пропустіть його або встановіть будь-яке значення, відмінне від `true`, щоб Plugin залишався типово вимкненим.                                                                  |
| `legacyPluginIds`                    | Ні          | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id Plugin.                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | Ні          | `string[]`                       | id provider, які повинні автоматично вмикати цей Plugin, коли auth, config або посилання на моделі згадують їх.                                                                                                                 |
| `kind`                               | Ні          | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип Plugin, що використовується `plugins.slots.*`.                                                                                                                                                         |
| `channels`                           | Ні          | `string[]`                       | id channel, якими володіє цей Plugin. Використовується для виявлення та валідації конфігурації.                                                                                                                                 |
| `providers`                          | Ні          | `string[]`                       | id provider, якими володіє цей Plugin.                                                                                                                                                                                            |
| `providerDiscoveryEntry`             | Ні          | `string`                         | Шлях до легковагого модуля виявлення provider, відносно кореня Plugin, для метаданих каталогу provider в межах маніфесту, які можна завантажити без активації повного runtime Plugin.                                           |
| `modelSupport`                       | Ні          | `object`                         | Короткі метадані model-family, що належать маніфесту і використовуються для автозавантаження Plugin до запуску runtime.                                                                                                         |
| `providerEndpoints`                  | Ні          | `object[]`                       | Метадані host/baseUrl endpoint, що належать маніфесту, для маршрутів provider, які core має класифікувати до завантаження runtime provider.                                                                                     |
| `cliBackends`                        | Ні          | `string[]`                       | id backend CLI, якими володіє цей Plugin. Використовується для автоактивації під час запуску з явних посилань у config.                                                                                                         |
| `syntheticAuthRefs`                  | Ні          | `string[]`                       | Посилання на provider або backend CLI, для яких слід перевіряти синтетичний hook auth, що належить Plugin, під час cold discovery моделей до завантаження runtime.                                                              |
| `nonSecretAuthMarkers`               | Ні          | `string[]`                       | Значення-заповнювачі API key, що належать вбудованому Plugin і представляють несекретний локальний стан, OAuth або ambient credential state.                                                                                     |
| `commandAliases`                     | Ні          | `object[]`                       | Імена команд, якими володіє цей Plugin і які повинні формувати діагностику config та CLI з урахуванням Plugin до завантаження runtime.                                                                                           |
| `providerAuthEnvVars`                | Ні          | `Record<string, string[]>`       | Застарілі сумісні метадані env для пошуку auth/status provider. Для нових Plugin надавайте перевагу `setup.providers[].envVars`; OpenClaw усе ще зчитує це протягом періоду deprecation.                                         |
| `providerAuthAliases`                | Ні          | `Record<string, string>`         | id provider, які повинні повторно використовувати інший id provider для пошуку auth, наприклад provider для кодування, що використовує той самий API key базового provider і профілі auth.                                       |
| `channelEnvVars`                     | Ні          | `Record<string, string[]>`       | Легковагі метадані env для channel, які OpenClaw може перевіряти без завантаження коду Plugin. Використовуйте це для setup channel на основі env або поверхонь auth, які мають бачити загальні helper запуску/конфігурації.     |
| `providerAuthChoices`                | Ні          | `object[]`                       | Легковагі метадані варіантів auth для селекторів onboarding, визначення preferred provider і простого зв’язування прапорців CLI.                                                                                                 |
| `activation`                         | Ні          | `object`                         | Легковагі метадані планувальника активації для завантаження за тригерами provider, command, channel, route і capability. Лише метадані; фактичною поведінкою все ще володіє runtime Plugin.                                     |
| `setup`                              | Ні          | `object`                         | Легковагі дескриптори setup/onboarding, які поверхні discovery та setup можуть перевіряти без завантаження runtime Plugin.                                                                                                       |
| `qaRunners`                          | Ні          | `object[]`                       | Легковагі дескриптори QA runner, які використовує спільний хост `openclaw qa` до завантаження runtime Plugin.                                                                                                                   |
| `contracts`                          | Ні          | `object`                         | Статичний знімок bundled capability для зовнішніх hook auth, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння tool. |
| `mediaUnderstandingProviderMetadata` | Ні          | `Record<string, object>`         | Легковагі типові значення media-understanding для id provider, оголошених у `contracts.mediaUnderstandingProviders`.                                                                                                             |
| `channelConfigs`                     | Ні          | `Record<string, object>`         | Метадані конфігурації channel, що належать маніфесту і об’єднуються в поверхні discovery та валідації до завантаження runtime.                                                                                                  |
| `skills`                             | Ні          | `string[]`                       | Каталоги Skills для завантаження, відносно кореня Plugin.                                                                                                                                                                        |
| `name`                               | Ні          | `string`                         | Зрозуміла людині назва Plugin.                                                                                                                                                                                                    |
| `description`                        | Ні          | `string`                         | Короткий опис, що показується в поверхнях Plugin.                                                                                                                                                                                |
| `version`                            | Ні          | `string`                         | Інформаційна версія Plugin.                                                                                                                                                                                                       |
| `uiHints`                            | Ні          | `Record<string, object>`         | UI-мітки, placeholders і підказки щодо чутливості для полів конфігурації.                                                                                                                                                        |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант onboarding або auth.
OpenClaw зчитує це до завантаження runtime provider.
Потік setup provider надає перевагу цим варіантам із маніфесту, а потім для сумісності повертається до метаданих wizard runtime і варіантів install-catalog.

| Поле                  | Обов’язкове | Тип                                             | Що воно означає                                                                                           |
| --------------------- | ----------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `provider`            | Так         | `string`                                        | id provider, до якого належить цей варіант.                                                               |
| `method`              | Так         | `string`                                        | id методу auth, до якого слід спрямувати.                                                                 |
| `choiceId`            | Так         | `string`                                        | Стабільний id варіанта auth, який використовується потоками onboarding і CLI.                             |
| `choiceLabel`         | Ні          | `string`                                        | Видима для користувача мітка. Якщо пропущено, OpenClaw використовує `choiceId`.                           |
| `choiceHint`          | Ні          | `string`                                        | Короткий допоміжний текст для селектора.                                                                  |
| `assistantPriority`   | Ні          | `number`                                        | Менші значення сортуються раніше в інтерактивних селекторах, керованих асистентом.                       |
| `assistantVisibility` | Ні          | `"visible"` \| `"manual-only"`                  | Приховує варіант із селекторів асистента, але все ще дозволяє ручний вибір через CLI.                    |
| `deprecatedChoiceIds` | Ні          | `string[]`                                      | Застарілі id варіантів, які повинні перенаправляти користувачів до цього варіанта-замінника.             |
| `groupId`             | Ні          | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                              |
| `groupLabel`          | Ні          | `string`                                        | Видима для користувача мітка цієї групи.                                                                  |
| `groupHint`           | Ні          | `string`                                        | Короткий допоміжний текст для групи.                                                                      |
| `optionKey`           | Ні          | `string`                                        | Внутрішній ключ параметра для простих потоків auth з одним прапорцем.                                    |
| `cliFlag`             | Ні          | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                     |
| `cliOption`           | Ні          | `string`                                        | Повна форма параметра CLI, наприклад `--openrouter-api-key <key>`.                                       |
| `cliDescription`      | Ні          | `string`                                        | Опис, що використовується в довідці CLI.                                                                  |
| `onboardingScopes`    | Ні          | `Array<"text-inference" \| "image-generation">` | У яких поверхнях onboarding має з’являтися цей варіант. Якщо пропущено, типово використовується `["text-inference"]`. |

## Довідник `commandAliases`

Використовуйте `commandAliases`, коли Plugin володіє назвою runtime-команди, яку користувачі можуть помилково вказати в `plugins.allow` або спробувати запустити як кореневу команду CLI. OpenClaw використовує ці метадані для діагностики без імпорту коду runtime Plugin.

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
| `name`       | Так         | `string`          | Назва команди, що належить цьому Plugin.                                   |
| `kind`       | Ні          | `"runtime-slash"` | Позначає alias як slash-команду чату, а не кореневу команду CLI.           |
| `cliCommand` | Ні          | `string`          | Пов’язана коренева команда CLI, яку слід підказати для операцій CLI, якщо вона існує. |

## Довідник `activation`

Використовуйте `activation`, коли Plugin може з мінімальними витратами оголосити, які події control plane мають включати його до плану активації/завантаження.

Цей блок є метаданими планувальника, а не API життєвого циклу. Він не реєструє поведінку runtime, не замінює `register(...)` і не гарантує, що код Plugin уже був виконаний. Планувальник активації використовує ці поля, щоб звузити коло кандидатів Plugin, перш ніж повертатися до наявних метаданих володіння з маніфесту, таких як `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` і hook.

Надавайте перевагу найвужчим метаданим, які вже описують володіння. Використовуйте `providers`, `channels`, `commandAliases`, дескриптори setup або `contracts`, коли ці поля виражають цей зв’язок. Використовуйте `activation` для додаткових підказок планувальника, які неможливо подати через ці поля володіння.

Цей блок містить лише метадані. Він не реєструє поведінку runtime і не замінює `register(...)`, `setupEntry` чи інші runtime/entrypoint Plugin.
Поточні споживачі використовують його як підказку для звуження кола перед ширшим завантаженням Plugin, тому відсутність метаданих активації зазвичай впливає лише на продуктивність; це не повинно змінювати коректність, доки все ще існують застарілі fallback-механізми володіння з маніфесту.

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

| Поле             | Обов’язкове | Тип                                                  | Що воно означає                                                                                          |
| ---------------- | ----------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `onProviders`    | Ні          | `string[]`                                           | id provider, які повинні включати цей Plugin до планів активації/завантаження.                           |
| `onCommands`     | Ні          | `string[]`                                           | id команд, які повинні включати цей Plugin до планів активації/завантаження.                             |
| `onChannels`     | Ні          | `string[]`                                           | id channel, які повинні включати цей Plugin до планів активації/завантаження.                            |
| `onRoutes`       | Ні          | `string[]`                                           | Типи route, які повинні включати цей Plugin до планів активації/завантаження.                            |
| `onCapabilities` | Ні          | `Array<"provider" \| "channel" \| "tool" \| "hook">` | Загальні підказки capability, що використовуються плануванням активації control plane. Коли можливо, надавайте перевагу вужчим полям. |

Поточні live-споживачі:

- планування CLI, запущене командою, повертається до застарілих
  `commandAliases[].cliCommand` або `commandAliases[].name`
- setup/channel planning, запущене channel, повертається до застарілого
  володіння `channels[]`, коли явні метадані активації channel відсутні
- setup/runtime planning, запущене provider, повертається до застарілого
  володіння `providers[]` і `cliBackends[]` верхнього рівня, коли явні
  метадані активації provider відсутні

Діагностика планувальника може розрізняти явні підказки активації та fallback за володінням у маніфесті. Наприклад, `activation-command-hint` означає, що спрацював збіг `activation.onCommands`, тоді як `manifest-command-alias` означає, що планувальник натомість використав володіння `commandAliases`. Ці мітки причин призначені для діагностики хоста і тестів; авторам Plugin слід і надалі оголошувати метадані, які найкраще описують володіння.

## Довідник `qaRunners`

Використовуйте `qaRunners`, коли Plugin додає один або кілька transport runner у спільному корені `openclaw qa`. Зберігайте ці метадані легковагими та статичними; фактичною реєстрацією CLI все ще володіє runtime Plugin через легковагу поверхню `runtime-api.ts`, яка експортує `qaRunnerCliRegistrations`.

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

Використовуйте `setup`, коли поверхням setup і onboarding потрібні легковагі метадані Plugin до завантаження runtime.

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

`cliBackends` верхнього рівня залишається чинним і далі описує backend CLI inference. `setup.cliBackends` — це поверхня дескрипторів, специфічна для setup, для потоків control-plane/setup, які повинні залишатися лише метаданими.

За наявності `setup.providers` і `setup.cliBackends` є бажаною поверхнею пошуку setup у стилі descriptor-first для discovery setup. Якщо дескриптор лише звужує коло кандидатів Plugin, а setup усе ще потребує багатших runtime-hook на етапі setup, встановіть `requiresRuntime: true` і залиште `setup-api` як резервний шлях виконання.

OpenClaw також включає `setup.providers[].envVars` у загальні пошуки auth provider і env var. `providerAuthEnvVars` залишається підтримуваним через адаптер сумісності протягом періоду deprecation, але невбудовані Plugin, які все ще його використовують, отримують діагностику маніфесту. Нові Plugin повинні розміщувати метадані env для setup/status у `setup.providers[].envVars`.

Встановлюйте `requiresRuntime: false` лише тоді, коли цих дескрипторів достатньо для поверхні setup. OpenClaw трактує явне `false` як контракт лише на рівні дескрипторів і не виконуватиме `setup-api` або `openclaw.setupEntry` для пошуку setup. Якщо Plugin, що працює лише на дескрипторах, усе ж містить один із цих runtime-entry setup, OpenClaw повідомляє про додаткову діагностику і продовжує його ігнорувати. Пропущене `requiresRuntime` зберігає застарілу fallback-поведінку, щоб не ламати наявні Plugin, які додали дескриптори без цього прапорця.

Оскільки пошук setup може виконувати код `setup-api`, що належить Plugin, нормалізовані значення `setup.providers[].id` і `setup.cliBackends[]` мають залишатися унікальними серед виявлених Plugin. Неоднозначне володіння закривається з відмовою, замість того щоб обирати переможця за порядком discovery.

Коли runtime setup все ж виконується, діагностика реєстру setup повідомляє про розходження descriptor, якщо `setup-api` реєструє provider або backend CLI, який не оголошено в дескрипторах маніфесту, або якщо для дескриптора немає відповідної runtime-реєстрації. Ці діагностики є додатковими й не призводять до відхилення застарілих Plugin.

### Довідник `setup.providers`

| Поле          | Обов’язкове | Тип        | Що воно означає                                                                        |
| ------------- | ----------- | ---------- | -------------------------------------------------------------------------------------- |
| `id`          | Так         | `string`   | id provider, доступний під час setup або onboarding. Зберігайте нормалізовані id глобально унікальними. |
| `authMethods` | Ні          | `string[]` | id методів setup/auth, які цей provider підтримує без завантаження повного runtime.   |
| `envVars`     | Ні          | `string[]` | Env var, які загальні поверхні setup/status можуть перевіряти до завантаження runtime Plugin. |

### Поля `setup`

| Поле               | Обов’язкове | Тип        | Що воно означає                                                                                      |
| ------------------ | ----------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `providers`        | Ні          | `object[]` | Дескриптори setup provider, доступні під час setup та onboarding.                                    |
| `cliBackends`      | Ні          | `string[]` | id backend, що використовуються під час setup для пошуку setup у стилі descriptor-first. Зберігайте нормалізовані id глобально унікальними. |
| `configMigrations` | Ні          | `string[]` | id міграцій config, якими володіє поверхня setup цього Plugin.                                       |
| `requiresRuntime`  | Ні          | `boolean`  | Чи потребує setup виконання `setup-api` після пошуку за дескриптором.                                |

## Довідник `uiHints`

`uiHints` — це мапа від назв полів config до невеликих підказок для рендерингу.

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

| Поле          | Тип        | Що воно означає                          |
| ------------- | ---------- | ---------------------------------------- |
| `label`       | `string`   | Видима для користувача мітка поля.       |
| `help`        | `string`   | Короткий допоміжний текст.               |
| `tags`        | `string[]` | Необов’язкові UI-теги.                   |
| `advanced`    | `boolean`  | Позначає поле як розширене.              |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.   |
| `placeholder` | `string`   | Текст placeholder для полів форми.       |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння capability, які OpenClaw може зчитати без імпорту runtime Plugin.

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex-app-server"],
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

| Поле                             | Тип        | Що воно означає                                                         |
| -------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Застарілі id embedded extension factory.                                |
| `agentToolResultMiddleware`      | `string[]` | id harness, для яких bundled Plugin може реєструвати middleware результатів tool. |
| `externalAuthProviders`          | `string[]` | id provider, hook зовнішніх профілів auth яких належить цьому Plugin.  |
| `speechProviders`                | `string[]` | id provider speech, якими володіє цей Plugin.                           |
| `realtimeTranscriptionProviders` | `string[]` | id provider realtime-transcription, якими володіє цей Plugin.           |
| `realtimeVoiceProviders`         | `string[]` | id provider realtime-voice, якими володіє цей Plugin.                   |
| `memoryEmbeddingProviders`       | `string[]` | id provider memory embedding, якими володіє цей Plugin.                 |
| `mediaUnderstandingProviders`    | `string[]` | id provider media-understanding, якими володіє цей Plugin.              |
| `imageGenerationProviders`       | `string[]` | id provider image-generation, якими володіє цей Plugin.                 |
| `videoGenerationProviders`       | `string[]` | id provider video-generation, якими володіє цей Plugin.                 |
| `webFetchProviders`              | `string[]` | id provider web-fetch, якими володіє цей Plugin.                        |
| `webSearchProviders`             | `string[]` | id provider web search, якими володіє цей Plugin.                       |
| `tools`                          | `string[]` | Назви agent tool, якими володіє цей Plugin для bundled-перевірок contract. |

`contracts.embeddedExtensionFactories` збережено для bundled-коду сумісності, якому все ще потрібні прямі події embedded-runner Pi. Нові bundled-перетворення результатів tool повинні оголошувати `contracts.agentToolResultMiddleware` і реєструватися через `api.registerAgentToolResultMiddleware(...)`. Зовнішні Plugin не можуть реєструвати middleware результатів tool, оскільки ця поверхня може переписувати high-trust-вивід tool до того, як модель його побачить.

Plugin provider, що реалізують `resolveExternalAuthProfiles`, повинні оголошувати `contracts.externalAuthProviders`. Plugin без цього оголошення все ще працюють через застарілий fallback сумісності, але цей fallback повільніший і буде видалений після вікна міграції.

Bundled provider memory embedding повинні оголошувати `contracts.memoryEmbeddingProviders` для кожного id адаптера, який вони надають, включно з вбудованими адаптерами, такими як `local`. Окремі шляхи CLI використовують цей contract маніфесту, щоб завантажувати лише Plugin-власник до того, як повний runtime Gateway зареєструє provider.

## Довідник `mediaUnderstandingProviderMetadata`

Використовуйте `mediaUnderstandingProviderMetadata`, коли provider media-understanding має типові моделі, пріоритет fallback auto-auth або нативну підтримку документів, які потрібні загальним helper core до завантаження runtime. Ключі також мають бути оголошені в `contracts.mediaUnderstandingProviders`.

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

| Поле                   | Тип                                 | Що воно означає                                                              |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | Можливості media, які надає цей provider.                                    |
| `defaultModels`        | `Record<string, string>`            | Типові значення model для capability, які використовуються, коли config не задає model. |
| `autoPriority`         | `Record<string, number>`            | Менші числа сортуються раніше для автоматичного fallback provider на основі credential. |
| `nativeDocumentInputs` | `"pdf"[]`                           | Нативні вхідні дані документів, які підтримує provider.                      |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли Plugin channel потребує легковагих метаданих config до завантаження runtime. Discovery setup/status channel лише для читання може використовувати ці метадані безпосередньо для налаштованих зовнішніх channel, коли запис setup недоступний або коли `setup.requiresRuntime: false` оголошує runtime setup непотрібним.

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

| Поле          | Тип                      | Що воно означає                                                                            |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------ |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису config channel. |
| `uiHints`     | `Record<string, object>` | Необов’язкові UI-мітки/placeholders/підказки чутливості для цього розділу config channel. |
| `label`       | `string`                 | Мітка channel, що об’єднується в поверхнях вибору та inspect, коли метадані runtime ще не готові. |
| `description` | `string`                 | Короткий опис channel для поверхонь inspect і catalog.                                     |
| `preferOver`  | `string[]`               | id застарілих або менш пріоритетних Plugin, які цей channel має перевершувати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має виводити ваш Plugin provider із скорочених id model, таких як `gpt-5.5` або `claude-sonnet-4.6`, до завантаження runtime Plugin.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує такий пріоритет:

- явні посилання `provider/model` використовують метадані маніфесту `providers` Plugin-власника
- `modelPatterns` мають вищий пріоритет за `modelPrefixes`
- якщо збігаються один невбудований Plugin і один вбудований Plugin, перемагає невбудований Plugin
- решта неоднозначностей ігноруються, доки користувач або config не вкаже provider

Поля:

| Поле            | Тип        | Що воно означає                                                                  |
| --------------- | ---------- | -------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, що зіставляються через `startsWith` зі скороченими id model.           |
| `modelPatterns` | `string[]` | Джерела regex, що зіставляються зі скороченими id model після видалення суфікса profile. |

Застарілі ключі capability верхнього рівня не рекомендуються. Використовуйте `openclaw doctor --fix`, щоб перенести `speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders` і `webSearchProviders` під `contracts`; звичайне завантаження маніфесту більше не розглядає ці поля верхнього рівня як володіння capability.

## Маніфест проти package.json

Ці два файли виконують різні завдання:

| Файл                   | Використовуйте його для                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, валідації config, метаданих варіантів auth і підказок UI, які мають існувати до запуску коду Plugin                 |
| `package.json`         | Метаданих npm, встановлення залежностей і блока `openclaw`, який використовується для entrypoint, обмежень встановлення, setup або метаданих catalog |

Якщо ви не впевнені, куди належить певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw має знати це до завантаження коду Plugin, розміщуйте це в `openclaw.plugin.json`
- якщо це стосується пакування, файлів entrypoint або поведінки встановлення npm, розміщуйте це в `package.json`

### Поля `package.json`, що впливають на discovery

Деякі метадані Plugin до запуску runtime навмисно розміщуються в `package.json` у блоці `openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Поле                                                              | Що воно означає                                                                                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                             | Оголошує entrypoint власного Plugin. Має залишатися в каталозі пакета Plugin.                                                                                                       |
| `openclaw.runtimeExtensions`                                      | Оголошує entrypoint runtime built JavaScript для встановлених пакетів. Має залишатися в каталозі пакета Plugin.                                                                    |
| `openclaw.setupEntry`                                             | Легковагий entrypoint лише для setup, який використовується під час onboarding, відкладеного запуску channel і discovery статусу channel/SecretRef лише для читання. Має залишатися в каталозі пакета Plugin. |
| `openclaw.runtimeSetupEntry`                                      | Оголошує built JavaScript entrypoint setup для встановлених пакетів. Має залишатися в каталозі пакета Plugin.                                                                      |
| `openclaw.channel`                                                | Легковагі метадані каталогу channel, такі як мітки, шляхи до документації, alias і текст для вибору.                                                                                |
| `openclaw.channel.configuredState`                                | Легковагі метадані перевірки configured-state, які можуть відповісти на питання «чи вже існує setup лише через env?» без завантаження повного runtime channel.                     |
| `openclaw.channel.persistedAuthState`                             | Легковагі метадані перевірки persisted-auth, які можуть відповісти на питання «чи вже є якийсь виконаний вхід?» без завантаження повного runtime channel.                           |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для bundled і зовнішньо опублікованих Plugin.                                                                                                       |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                                                                |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw, із нижньою межею semver на кшталт `>=2026.3.22`.                                                                                    |
| `openclaw.install.expectedIntegrity`                              | Очікуваний рядок цілісності npm dist, наприклад `sha512-...`; потоки встановлення й оновлення перевіряють отриманий артефакт відносно нього.                                       |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення через перевстановлення bundled Plugin, коли config некоректний.                                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням channel лише для setup завантажуватися до повного Plugin channel під час запуску.                                                                                |

Метадані маніфесту визначають, які варіанти provider/channel/setup з’являються в onboarding до завантаження runtime. `package.json#openclaw.install` повідомляє onboarding, як отримати або ввімкнути цей Plugin, коли користувач вибирає один із цих варіантів. Не переносіть підказки встановлення в `openclaw.plugin.json`.

`openclaw.install.minHostVersion` застосовується під час встановлення і завантаження реєстру маніфесту. Некоректні значення відхиляються; новіші, але коректні значення пропускають Plugin на старіших хостах.

Точне закріплення версії npm уже розміщується в `npmSpec`, наприклад
`"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`. Офіційні записи зовнішнього каталогу мають поєднувати точні специфікації з `expectedIntegrity`, щоб потоки оновлення завершувалися відмовою, якщо отриманий npm-артефакт більше не відповідає закріпленому релізу.
Інтерактивний onboarding усе ще пропонує npm-специфікації довіреного реєстру, зокрема прості назви пакетів і dist-tag, для сумісності. Діагностика каталогу може розрізняти точні, плаваючі, закріплені за цілісністю, без закріплення цілісності, з невідповідністю імені пакета та некоректні джерела default-choice. Вона також попереджає, коли `expectedIntegrity` присутній, але немає коректного джерела npm, яке можна ним закріпити.
Коли `expectedIntegrity` присутній, потоки встановлення/оновлення застосовують його; коли його пропущено, визначення реєстру записується без закріплення цілісності.

Plugin channel повинні надавати `openclaw.setupEntry`, коли статус, список channel або сканування SecretRef мають визначати налаштовані акаунти без завантаження повного runtime. Запис setup повинен надавати метадані channel разом із безпечними для setup адаптерами config, status і secrets; мережеві клієнти, listener Gateway і transport runtime залишайте в основному entrypoint extension.

Поля runtime entrypoint не перевизначають перевірки меж пакета для полів source entrypoint. Наприклад, `openclaw.runtimeExtensions` не може зробити придатним до завантаження шлях `openclaw.extensions`, що виходить за межі пакета.

`openclaw.install.allowInvalidConfigRecovery` навмисно вузький. Він не робить довільні зламані config придатними до встановлення. Наразі він лише дозволяє потокам встановлення відновлюватися після певних застарілих збоїв оновлення bundled Plugin, наприклад відсутнього шляху bundled Plugin або застарілого запису `channels.<id>` для того самого bundled Plugin. Непов’язані помилки config усе ще блокують встановлення й спрямовують операторів до `openclaw doctor --fix`.

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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна дешева перевірка auth типу так/ні до завантаження повного Plugin channel. Цільовий export має бути невеликою функцією, яка читає лише збережений стан; не спрямовуйте її через широкий barrel повного runtime channel.

`openclaw.channel.configuredState` має таку саму форму для дешевих перевірок configured-state лише через env:

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

Використовуйте це, коли channel може визначити configured-state з env або інших невеликих нерuntime-вхідних даних. Якщо перевірка потребує повного визначення config або реального runtime channel, залишайте цю логіку в hook Plugin `config.hasConfiguredState`.

## Пріоритет discovery (дублікати id Plugin)

OpenClaw виявляє Plugin з кількох коренів (bundled, global install, workspace, явно вибрані в config шляхи). Якщо два результати discovery мають однаковий `id`, зберігається лише маніфест із **найвищим пріоритетом**; дублікати з нижчим пріоритетом відкидаються замість завантаження поруч.

Пріоритет від найвищого до найнижчого:

1. **Config-selected** — шлях, явно закріплений у `plugins.entries.<id>`
2. **Bundled** — Plugin, що постачаються з OpenClaw
3. **Global install** — Plugin, встановлені в глобальний корінь Plugin OpenClaw
4. **Workspace** — Plugin, виявлені відносно поточного workspace

Наслідки:

- Форк або застаріла копія bundled Plugin, що лежить у workspace, не затьмарить bundled-збірку.
- Щоб справді перевизначити bundled Plugin локальним, закріпіть його через `plugins.entries.<id>`, щоб він виграв за пріоритетом, а не покладайтеся на discovery workspace.
- Відкидання дублікатів журналюється, щоб Doctor і діагностика запуску могли вказувати на відкинуту копію.

## Вимоги до JSON Schema

- **Кожен Plugin повинен містити JSON Schema**, навіть якщо він не приймає config.
- Порожня schema допустима (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Schema проходять валідацію під час читання/запису config, а не під час runtime.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки id channel не оголошено в маніфесті Plugin.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  повинні посилатися на **доступні для discovery** id Plugin. Невідомі id є **помилками**.
- Якщо Plugin встановлено, але він має зламаний або відсутній маніфест чи schema,
  валідація завершується помилкою, а Doctor повідомляє про помилку Plugin.
- Якщо config Plugin існує, але Plugin **вимкнено**, config зберігається, а в Doctor і логах з’являється **попередження**.

Дивіться [Довідник з конфігурації](/uk/gateway/configuration) для повної schema `plugins.*`.

## Примітки

- Маніфест є **обов’язковим для власних Plugin OpenClaw**, зокрема для локальних завантажень із файлової системи. Runtime усе ще завантажує модуль Plugin окремо; маніфест використовується лише для discovery + валідації.
- Власні маніфести розбираються через JSON5, тож коментарі, завершальні коми й ключі без лапок приймаються, якщо кінцеве значення все одно є об’єктом.
- Завантажувач маніфесту зчитує лише документовані поля маніфесту. Уникайте власних ключів верхнього рівня.
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо Plugin їх не потребує.
- `providerDiscoveryEntry` має залишатися легковагим і не повинен імпортувати широкий runtime-код; використовуйте його для статичних метаданих каталогу provider або вузьких дескрипторів discovery, а не для виконання під час обробки запитів.
- Ексклюзивні типи Plugin вибираються через `plugins.slots.*`: `kind: "memory"` через `plugins.slots.memory`, `kind: "context-engine"` через `plugins.slots.contextEngine` (типово `legacy`).
- Метадані env var (`setup.providers[].envVars`, застарілий `providerAuthEnvVars` і `channelEnvVars`) є лише декларативними. Status, audit, валідація доставки Cron та інші поверхні лише для читання все одно застосовують політику довіри до Plugin і ефективної активації, перш ніж вважати env var налаштованою.
- Для метаданих runtime wizard, які потребують коду provider, дивіться [Runtime-hook provider](/uk/plugins/architecture-internals#provider-runtime-hooks).
- Якщо ваш Plugin залежить від native modules, задокументуйте кроки збірки та будь-які вимоги до allowlist менеджера пакетів (наприклад, pnpm `allow-build-scripts` + `pnpm rebuild <package>`).

## Пов’язане

<CardGroup cols={3}>
  <Card title="Створення Plugin" href="/uk/plugins/building-plugins" icon="rocket">
    Початок роботи з Plugin.
  </Card>
  <Card title="Архітектура Plugin" href="/uk/plugins/architecture" icon="diagram-project">
    Внутрішня архітектура та модель capability.
  </Card>
  <Card title="Огляд SDK" href="/uk/plugins/sdk-overview" icon="book">
    Довідник SDK Plugin та імпорти підшляхів.
  </Card>
</CardGroup>
