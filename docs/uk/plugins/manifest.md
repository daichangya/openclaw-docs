---
read_when:
    - Ви створюєте плагін OpenClaw
    - Вам потрібно постачати schema конфігурації плагіна або налагодити помилки валідації плагіна
summary: Маніфест плагіна + вимоги до JSON schema (сувора валідація конфігурації)
title: Маніфест плагіна
x-i18n:
    generated_at: "2026-04-06T12:44:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15f70fd171d1aad334f01272e035e9a322a4c5c8a983180e6c38f4298b9e9158
    source_path: plugins/manifest.md
    workflow: 15
---

# Маніфест плагіна (openclaw.plugin.json)

Ця сторінка стосується лише **власного маніфесту плагіна OpenClaw**.

Сумісні макети bundle описано в [Plugin bundles](/uk/plugins/bundles).

Сумісні формати bundle використовують інші файли маніфесту:

- Codex bundle: `.codex-plugin/plugin.json`
- Claude bundle: `.claude-plugin/plugin.json` або стандартний макет компонента Claude
  без маніфесту
- Cursor bundle: `.cursor-plugin/plugin.json`

OpenClaw також автоматично виявляє ці макети bundle, але вони не проходять валідацію
за schema `openclaw.plugin.json`, описаною тут.

Для сумісних bundle OpenClaw наразі зчитує метадані bundle разом із оголошеними
коренями Skills, коренями команд Claude, типових значеннях Claude bundle `settings.json`,
типових значеннях Claude bundle LSP і підтримуваних наборах hook, коли макет відповідає
очікуванням середовища виконання OpenClaw.

Кожен власний плагін OpenClaw **має** постачатися з файлом `openclaw.plugin.json` у
**корені плагіна**. OpenClaw використовує цей маніфест для валідації конфігурації
**без виконання коду плагіна**. Відсутні або недійсні маніфести вважаються
помилками плагіна і блокують валідацію конфігурації.

Дивіться повний посібник із системи плагінів: [Plugins](/uk/tools/plugin).
Для моделі власних можливостей і поточних рекомендацій щодо зовнішньої сумісності:
[Capability model](/uk/plugins/architecture#public-capability-model).

## Що робить цей файл

`openclaw.plugin.json` — це метадані, які OpenClaw зчитує перед завантаженням
коду вашого плагіна.

Використовуйте його для:

- ідентичності плагіна
- валідації конфігурації
- метаданих автентифікації та онбордингу, які мають бути доступні без запуску
  середовища виконання плагіна
- метаданих псевдонімів і автоувімкнення, які мають визначатися до завантаження
  середовища виконання плагіна
- метаданих володіння скороченими сімействами моделей, які мають автоматично
  активувати плагін до завантаження середовища виконання
- статичних знімків володіння можливостями, що використовуються для вбудованої compat-обв’язки та
  покриття контрактів
- метаданих конфігурації каналів, специфічних для каналу, які мають зливатися в поверхні каталогу та валідації
  без завантаження середовища виконання
- підказок UI конфігурації

Не використовуйте його для:

- реєстрації поведінки середовища виконання
- оголошення code entrypoint
- метаданих встановлення npm

Для цього призначені код вашого плагіна та `package.json`.

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
  "cliBackends": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

| Field                               | Required | Type                             | What it means                                                                                                                                                                                                |
| ----------------------------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | Yes      | `string`                         | Канонічний id плагіна. Це id, який використовується в `plugins.entries.<id>`.                                                                                                                               |
| `configSchema`                      | Yes      | `object`                         | Вбудована JSON Schema для конфігурації цього плагіна.                                                                                                                                                        |
| `enabledByDefault`                  | No       | `true`                           | Позначає вбудований плагін як увімкнений типово. Пропустіть його або задайте будь-яке значення, відмінне від `true`, щоб залишити плагін вимкненим типово.                                               |
| `legacyPluginIds`                   | No       | `string[]`                       | Застарілі id, які нормалізуються до цього канонічного id плагіна.                                                                                                                                            |
| `autoEnableWhenConfiguredProviders` | No       | `string[]`                       | Id провайдерів, які мають автоматично вмикати цей плагін, коли на них посилаються автентифікація, конфігурація або model ref.                                                                              |
| `kind`                              | No       | `"memory"` \| `"context-engine"` | Оголошує ексклюзивний тип плагіна, який використовується `plugins.slots.*`.                                                                                                                                  |
| `channels`                          | No       | `string[]`                       | Id каналів, якими володіє цей плагін. Використовується для виявлення та валідації конфігурації.                                                                                                             |
| `providers`                         | No       | `string[]`                       | Id провайдерів, якими володіє цей плагін.                                                                                                                                                                     |
| `modelSupport`                      | No       | `object`                         | Метадані скорочених сімейств моделей, що належать маніфесту та використовуються для автоматичного завантаження плагіна до середовища виконання.                                                            |
| `cliBackends`                       | No       | `string[]`                       | Id CLI-бекендів inference, якими володіє цей плагін. Використовується для автоактивації під час запуску на основі явних посилань у конфігурації.                                                            |
| `providerAuthEnvVars`               | No       | `Record<string, string[]>`       | Легкі метадані env автентифікації провайдера, які OpenClaw може перевіряти без завантаження коду плагіна.                                                                                                   |
| `providerAuthChoices`               | No       | `object[]`                       | Легкі метадані варіантів автентифікації для онбординг-пікерів, визначення preferred-provider та простого зв’язування прапорців CLI.                                                                         |
| `contracts`                         | No       | `object`                         | Статичний знімок вбудованих можливостей для speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search і володіння інструментами. |
| `channelConfigs`                    | No       | `Record<string, object>`         | Метадані конфігурації каналу, що належать маніфесту та зливаються в поверхні виявлення та валідації до завантаження середовища виконання.                                                                  |
| `skills`                            | No       | `string[]`                       | Каталоги Skills для завантаження, відносно кореня плагіна.                                                                                                                                                   |
| `name`                              | No       | `string`                         | Людинозрозуміла назва плагіна.                                                                                                                                                                                |
| `description`                       | No       | `string`                         | Короткий опис, який показується в поверхнях плагіна.                                                                                                                                                         |
| `version`                           | No       | `string`                         | Інформаційна версія плагіна.                                                                                                                                                                                  |
| `uiHints`                           | No       | `Record<string, object>`         | Мітки UI, placeholder і підказки щодо чутливості для полів конфігурації.                                                                                                                                     |

## Довідник `providerAuthChoices`

Кожен запис `providerAuthChoices` описує один варіант онбордингу або автентифікації.
OpenClaw зчитує це до завантаження середовища виконання провайдера.

| Field                 | Required | Type                                            | What it means                                                                                            |
| --------------------- | -------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | Yes      | `string`                                        | Id провайдера, до якого належить цей варіант.                                                           |
| `method`              | Yes      | `string`                                        | Id методу автентифікації, до якого слід маршрутизувати.                                                 |
| `choiceId`            | Yes      | `string`                                        | Стабільний id варіанта автентифікації, який використовується в онбордингу та CLI-потоках.              |
| `choiceLabel`         | No       | `string`                                        | Мітка для користувача. Якщо пропущено, OpenClaw використовує `choiceId`.                                |
| `choiceHint`          | No       | `string`                                        | Короткий допоміжний текст для пікера.                                                                   |
| `assistantPriority`   | No       | `number`                                        | Менші значення сортуються раніше в інтерактивних пікерах, керованих помічником.                         |
| `assistantVisibility` | No       | `"visible"` \| `"manual-only"`                  | Ховає варіант із пікерів помічника, але все ще дозволяє ручний вибір у CLI.                             |
| `deprecatedChoiceIds` | No       | `string[]`                                      | Застарілі id варіантів, які мають перенаправляти користувачів на цей варіант-заміну.                   |
| `groupId`             | No       | `string`                                        | Необов’язковий id групи для групування пов’язаних варіантів.                                            |
| `groupLabel`          | No       | `string`                                        | Мітка цієї групи для користувача.                                                                       |
| `groupHint`           | No       | `string`                                        | Короткий допоміжний текст для групи.                                                                    |
| `optionKey`           | No       | `string`                                        | Внутрішній ключ опції для простих потоків автентифікації з одним прапорцем.                             |
| `cliFlag`             | No       | `string`                                        | Назва прапорця CLI, наприклад `--openrouter-api-key`.                                                   |
| `cliOption`           | No       | `string`                                        | Повна форма опції CLI, наприклад `--openrouter-api-key <key>`.                                          |
| `cliDescription`      | No       | `string`                                        | Опис, який використовується в довідці CLI.                                                              |
| `onboardingScopes`    | No       | `Array<"text-inference" \| "image-generation">` | У яких поверхнях онбордингу має з’являтися цей варіант. Якщо пропущено, типово використовується `["text-inference"]`. |

## Довідник `uiHints`

`uiHints` — це мапа імен полів конфігурації до невеликих підказок рендерингу.

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

Підказка кожного поля може містити:

| Field         | Type       | What it means                           |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | Мітка поля для користувача.             |
| `help`        | `string`   | Короткий допоміжний текст.              |
| `tags`        | `string[]` | Необов’язкові теги UI.                  |
| `advanced`    | `boolean`  | Позначає поле як розширене.             |
| `sensitive`   | `boolean`  | Позначає поле як секретне або чутливе.  |
| `placeholder` | `string`   | Текст placeholder для полів форми.      |

## Довідник `contracts`

Використовуйте `contracts` лише для статичних метаданих володіння можливостями, які OpenClaw може
зчитати без імпортування середовища виконання плагіна.

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

| Field                            | Type       | What it means                                                  |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | Id провайдерів speech, якими володіє цей плагін.               |
| `realtimeTranscriptionProviders` | `string[]` | Id провайдерів realtime-transcription, якими володіє цей плагін. |
| `realtimeVoiceProviders`         | `string[]` | Id провайдерів realtime-voice, якими володіє цей плагін.       |
| `mediaUnderstandingProviders`    | `string[]` | Id провайдерів media-understanding, якими володіє цей плагін.  |
| `imageGenerationProviders`       | `string[]` | Id провайдерів image-generation, якими володіє цей плагін.     |
| `videoGenerationProviders`       | `string[]` | Id провайдерів video-generation, якими володіє цей плагін.     |
| `webFetchProviders`              | `string[]` | Id провайдерів web-fetch, якими володіє цей плагін.            |
| `webSearchProviders`             | `string[]` | Id провайдерів web-search, якими володіє цей плагін.           |
| `tools`                          | `string[]` | Назви інструментів агента, якими володіє цей плагін, для перевірок вбудованих контрактів. |

## Довідник `channelConfigs`

Використовуйте `channelConfigs`, коли плагіну каналу потрібні легкі метадані конфігурації до
завантаження середовища виконання.

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

| Field         | Type                     | What it means                                                                             |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | JSON Schema для `channels.<id>`. Обов’язкове для кожного оголошеного запису конфігурації каналу. |
| `uiHints`     | `Record<string, object>` | Необов’язкові мітки UI/placeholder/підказки щодо чутливості для цього розділу конфігурації каналу. |
| `label`       | `string`                 | Мітка каналу, що зливається в поверхні пікера та inspect, коли метадані середовища виконання ще не готові. |
| `description` | `string`                 | Короткий опис каналу для поверхонь inspect і каталогу.                                    |
| `preferOver`  | `string[]`               | Id застарілих або менш пріоритетних плагінів, які цей канал має випереджати в поверхнях вибору. |

## Довідник `modelSupport`

Використовуйте `modelSupport`, коли OpenClaw має визначати ваш плагін провайдера з
коротких id моделей, таких як `gpt-5.4` або `claude-sonnet-4.6`, до завантаження середовища виконання плагіна.

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw застосовує таку пріоритетність:

- явні посилання `provider/model` використовують метадані маніфесту `providers`, що належать відповідному плагіну
- `modelPatterns` мають вищий пріоритет за `modelPrefixes`
- якщо збігаються один невбудований плагін і один вбудований плагін, перемагає невбудований
  плагін
- решта неоднозначностей ігноруються, доки користувач або конфігурація не вкаже провайдера

Поля:

| Field           | Type       | What it means                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | Префікси, які перевіряються через `startsWith` для скорочених id моделей.       |
| `modelPatterns` | `string[]` | Джерела regex, які зіставляються зі скороченими id моделей після видалення суфікса профілю. |

Застарілі ключі можливостей верхнього рівня не рекомендовані. Використовуйте `openclaw doctor --fix`, щоб
перемістити `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders` і `webSearchProviders` у `contracts`; звичайне
завантаження маніфесту більше не трактує ці поля верхнього рівня як
володіння можливостями.

## Маніфест і package.json

Ці два файли виконують різні ролі:

| File                   | Use it for                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Виявлення, валідація конфігурації, метадані варіантів автентифікації та підказки UI, які мають існувати до запуску коду плагіна |
| `package.json`         | Метадані npm, встановлення залежностей і блок `openclaw`, який використовується для entrypoint, обмежень встановлення, налаштування або метаданих каталогу |

Якщо ви не впевнені, де має бути певний фрагмент метаданих, використовуйте таке правило:

- якщо OpenClaw має знати про нього до завантаження коду плагіна, помістіть його в `openclaw.plugin.json`
- якщо це стосується пакування, вхідних файлів або поведінки встановлення npm, помістіть це в `package.json`

### Поля package.json, які впливають на виявлення

Деякі метадані плагіна для етапу до середовища виконання навмисно зберігаються в `package.json` у блоці
`openclaw`, а не в `openclaw.plugin.json`.

Важливі приклади:

| Field                                                             | What it means                                                                                                                                |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | Оголошує власні entrypoint плагіна.                                                                                                          |
| `openclaw.setupEntry`                                             | Легкий entrypoint лише для налаштування, який використовується під час онбордингу та відкладеного запуску каналу.                          |
| `openclaw.channel`                                                | Легкі метадані каталогу каналів, як-от мітки, шляхи до документації, псевдоніми та текст для вибору.                                       |
| `openclaw.channel.configuredState`                                | Легкі метадані перевірки configured-state, які можуть відповісти на запитання «чи вже існує налаштування лише через env?» без завантаження повного середовища виконання каналу. |
| `openclaw.channel.persistedAuthState`                             | Легкі метадані перевірки persisted-auth, які можуть відповісти на запитання «чи вже щось увійшло в систему?» без завантаження повного середовища виконання каналу. |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | Підказки встановлення/оновлення для вбудованих і зовнішньо опублікованих плагінів.                                                          |
| `openclaw.install.defaultChoice`                                  | Бажаний шлях встановлення, коли доступно кілька джерел встановлення.                                                                        |
| `openclaw.install.minHostVersion`                                 | Мінімальна підтримувана версія хоста OpenClaw, із нижньою межею semver, наприклад `>=2026.3.22`.                                            |
| `openclaw.install.allowInvalidConfigRecovery`                     | Дозволяє вузький шлях відновлення перевстановлення вбудованого плагіна, коли конфігурація недійсна.                                         |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | Дозволяє поверхням каналу лише для налаштування завантажуватися до повного плагіна каналу під час запуску.                                  |

`openclaw.install.minHostVersion` застосовується під час встановлення та
завантаження реєстру маніфестів. Недійсні значення відхиляються; новіші, але коректні значення пропускають
плагін на старіших хостах.

`openclaw.install.allowInvalidConfigRecovery` навмисно має вузьке призначення. Воно
не робить довільні зламані конфігурації придатними до встановлення. Сьогодні воно лише дозволяє
потокам встановлення відновлюватися після певних застарілих збоїв оновлення вбудованих плагінів, таких як
відсутній шлях до вбудованого плагіна або застарілий запис `channels.<id>` для цього самого
вбудованого плагіна. Непов’язані помилки конфігурації й далі блокують встановлення та спрямовують операторів
до `openclaw doctor --fix`.

`openclaw.channel.persistedAuthState` — це метадані пакета для крихітного модуля
перевірки:

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

Використовуйте це, коли потокам setup, doctor або configured-state потрібна легка
yes/no перевірка автентифікації до завантаження повного плагіна каналу. Цільовий експорт має бути невеликою
функцією, яка зчитує лише збережений стан; не маршрутизуйте її через повний barrel середовища виконання
каналу.

`openclaw.channel.configuredState` має ту саму форму для легких перевірок
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

Використовуйте це, коли канал може визначити configured-state через env або інші малі
невиконувані входи. Якщо перевірці потрібне повне визначення конфігурації або реальне
середовище виконання каналу, залиште цю логіку в hook `config.hasConfiguredState`
плагіна.

## Вимоги до JSON Schema

- **Кожен плагін має постачати JSON Schema**, навіть якщо він не приймає конфігурацію.
- Порожня schema прийнятна (наприклад, `{ "type": "object", "additionalProperties": false }`).
- Schema проходять валідацію під час читання/запису конфігурації, а не під час виконання.

## Поведінка валідації

- Невідомі ключі `channels.*` є **помилками**, якщо тільки id каналу не оголошено
  маніфестом плагіна.
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny` і `plugins.slots.*`
  мають посилатися на **виявлювані** id плагінів. Невідомі id є **помилками**.
- Якщо плагін встановлено, але його маніфест або schema зламані чи відсутні,
  валідація завершується помилкою, і Doctor повідомляє про помилку плагіна.
- Якщо конфігурація плагіна існує, але плагін **вимкнено**, конфігурація зберігається, і
  в Doctor + логах показується **попередження**.

Дивіться [Configuration reference](/uk/gateway/configuration), щоб переглянути повну schema `plugins.*`.

## Примітки

- Маніфест **обов’язковий для власних плагінів OpenClaw**, зокрема для локальних завантажень із файлової системи.
- Середовище виконання й далі завантажує модуль плагіна окремо; маніфест використовується лише для
  виявлення + валідації.
- Власні маніфести розбираються за допомогою JSON5, тож коментарі, кінцеві коми та
  ключі без лапок приймаються, якщо фінальне значення все ще є об’єктом.
- Завантажувач маніфесту читає лише задокументовані поля маніфесту. Уникайте додавання
  власних ключів верхнього рівня сюди.
- `providerAuthEnvVars` — це легкий шлях метаданих для перевірок автентифікації, валідації
  env-маркерів і подібних поверхонь автентифікації провайдера, які не повинні запускати середовище виконання плагіна
  лише для перевірки назв env.
- `providerAuthChoices` — це легкий шлях метаданих для пікерів варіантів автентифікації,
  визначення `--auth-choice`, мапінгу preferred-provider і простої реєстрації прапорців CLI
  до завантаження середовища виконання провайдера. Для метаданих wizard у середовищі виконання,
  яким потрібен код провайдера, дивіться
  [Provider runtime hooks](/uk/plugins/architecture#provider-runtime-hooks).
- Ексклюзивні типи плагінів вибираються через `plugins.slots.*`.
  - `kind: "memory"` вибирається через `plugins.slots.memory`.
  - `kind: "context-engine"` вибирається через `plugins.slots.contextEngine`
    (типово: вбудований `legacy`).
- `channels`, `providers`, `cliBackends` і `skills` можна не вказувати, якщо
  плагіну вони не потрібні.
- Якщо ваш плагін залежить від власних модулів, задокументуйте кроки збирання та будь-які
  вимоги до allowlist пакетного менеджера (наприклад, pnpm `allow-build-scripts`
  - `pnpm rebuild <package>`).

## Пов’язане

- [Building Plugins](/uk/plugins/building-plugins) — початок роботи з плагінами
- [Plugin Architecture](/uk/plugins/architecture) — внутрішня архітектура
- [SDK Overview](/uk/plugins/sdk-overview) — довідник Plugin SDK
