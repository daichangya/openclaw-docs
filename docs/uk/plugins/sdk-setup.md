---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Вам потрібно зрозуміти різницю між `setup-entry.ts` і `index.ts`
    - Ви визначаєте схеми конфігурації Plugin або метадані `openclaw` у `package.json`
sidebarTitle: Setup and Config
summary: Майстри налаштування, `setup-entry.ts`, схеми конфігурації та метадані `package.json`
title: Налаштування Plugin і конфігурація
x-i18n:
    generated_at: "2026-04-20T16:49:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5de51b55c04b4f05947bc2d4de9c34e24a26e4ca8b3ff9b1711288a8e5b63273
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Налаштування Plugin і конфігурація

Довідник щодо пакування plugin (`package.json` metadata), маніфестів
(`openclaw.plugin.json`), записів налаштування та схем конфігурації.

<Tip>
  **Шукаєте покрокову інструкцію?** Практичні посібники розглядають пакування в контексті:
  [Channel Plugins](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і
  [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Ваш `package.json` має містити поле `openclaw`, яке повідомляє системі plugin, що
надає ваш plugin:

**Channel plugin:**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Provider plugin / базовий варіант для публікації ClawHub:**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Якщо ви публікуєте plugin зовнішньо в ClawHub, поля `compat` і `build`
є обов’язковими. Канонічні фрагменти для публікації містяться в
`docs/snippets/plugin-publish/`.

### Поля `openclaw`

| Поле         | Тип        | Опис                                                                                                           |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Файли точок входу (відносно кореня пакета)                                                                     |
| `setupEntry` | `string`   | Легка точка входу лише для налаштування (необов’язково)                                                        |
| `channel`    | `object`   | Метадані каталогу channel для налаштування, вибору, quickstart і поверхонь статусу                             |
| `providers`  | `string[]` | Ідентифікатори provider, які реєструє цей plugin                                                               |
| `install`    | `object`   | Підказки для встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Прапорці поведінки під час запуску                                                                             |

### `openclaw.channel`

`openclaw.channel` — це недорогі метадані пакета для виявлення channel і
поверхонь налаштування до завантаження runtime.

| Поле                                   | Тип        | Що воно означає                                                              |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор channel.                                            |
| `label`                                | `string`   | Основна мітка channel.                                                       |
| `selectionLabel`                       | `string`   | Мітка для picker/налаштування, якщо вона має відрізнятися від `label`.       |
| `detailLabel`                          | `string`   | Вторинна мітка деталей для багатших каталогів channel і поверхонь статусу.   |
| `docsPath`                             | `string`   | Шлях до документації для посилань налаштування та вибору.                    |
| `docsLabel`                            | `string`   | Перевизначення мітки для посилань на документацію, якщо вона має відрізнятися від ідентифікатора channel. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                       |
| `order`                                | `number`   | Порядок сортування в каталогах channel.                                      |
| `aliases`                              | `string[]` | Додаткові псевдоніми пошуку для вибору channel.                              |
| `preferOver`                           | `string[]` | Ідентифікатори plugin/channel з нижчим пріоритетом, які цей channel має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва icon/system-image для каталогів UI channel.              |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями на документацію в поверхнях вибору.          |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях до документації безпосередньо замість іменованого посилання в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, що додаються в тексті вибору.                       |
| `markdownCapable`                      | `boolean`  | Позначає channel як сумісний із markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Керування видимістю channel для налаштування, списків налаштованих елементів і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Додає цей channel до стандартного потоку налаштування quickstart `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Вимагає явного прив’язування облікового запису, навіть якщо існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Надає перевагу пошуку session під час визначення цілей announce для цього channel. |

Приклад:

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` підтримує:

- `configured`: включати channel до поверхонь списків у стилі configured/status
- `setup`: включати channel до інтерактивних picker налаштування/конфігурації
- `docs`: позначати channel як публічно доступний на поверхнях документації/навігації

`showConfigured` і `showInSetup` як і раніше підтримуються як застарілі псевдоніми. Рекомендовано
використовувати `exposure`.

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                  | Що воно означає                                                                |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | Канонічна npm-специфікація для потоків встановлення/оновлення.                 |
| `localPath`                  | `string`             | Локальний шлях для розробки або вбудованого встановлення.                      |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва варіанти.                    |
| `minHostVersion`             | `string`             | Мінімально підтримувана версія OpenClaw у форматі `>=x.y.z`.                   |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення вбудованих plugin відновлюватися після певних збоїв через застарілу конфігурацію. |

Якщо задано `minHostVersion`, і встановлення, і завантаження реєстру маніфестів
застосовують цю вимогу. Старіші host пропускають plugin; недійсні рядки версій відхиляються.

`allowInvalidConfigRecovery` — це не загальний обхід для зламаних конфігурацій. Він призначений
лише для вузького сценарію відновлення вбудованих plugin, щоб перевстановлення/налаштування могли виправити
відомі залишки після оновлення, наприклад відсутній шлях до вбудованого plugin або застарілий запис `channels.<id>`
для цього самого plugin. Якщо конфігурація зламана з не пов’язаних причин, встановлення
усе одно завершується без поблажок і повідомляє оператору виконати `openclaw doctor --fix`.

### Відкладене повне завантаження

Channel plugins можуть увімкнути відкладене завантаження за допомогою:

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

Коли це увімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску до listen,
навіть для вже налаштованих channel. Повна точка входу завантажується після того, як Gateway
починає прослуховування.

<Warning>
  Вмикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що
  потрібно Gateway до початку прослуховування (реєстрація channel, HTTP-маршрути,
  методи Gateway). Якщо повна точка входу володіє необхідними можливостями запуску, залишайте
  поведінку за замовчуванням.
</Warning>

Якщо ваш запис налаштування/повний запис реєструє методи RPC Gateway, залишайте їх на
префіксі, специфічному для plugin. Зарезервовані простори імен core admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності core і завжди визначаються
як `operator.admin`.

## Маніфест Plugin

Кожен нативний plugin має постачатися з `openclaw.plugin.json` у корені пакета.
OpenClaw використовує це для валідації конфігурації без виконання коду plugin.

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

Для channel plugins додайте `kind` і `channels`:

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

Навіть plugins без конфігурації мають постачатися зі схемою. Порожня схема є коректною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Див. [Plugin Manifest](/uk/plugins/manifest), щоб ознайомитися з повним довідником щодо схеми.

## Публікація ClawHub

Для пакетів plugin використовуйте команду ClawHub, специфічну для пакета:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Застарілий псевдонім публікації лише для skill призначений для skills. Пакети plugin
завжди мають використовувати `clawhub package publish`.

## Запис налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку
OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, відновлення конфігурації,
перевірка вимкненого channel).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дозволяє уникнути завантаження важкого runtime-коду (криптобібліотеки, реєстрації CLI,
фонові служби) під час потоків налаштування.

Вбудовані workspace channel, які зберігають безпечні для налаштування експорти в sidecar-модулях, можуть
використовувати `defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract` замість
`defineSetupPluginEntry(...)`. Цей контракт для вбудованих елементів також підтримує необов’язковий
експорт `runtime`, щоб налаштування runtime під час етапу налаштування залишалося легким і явним.

**Коли OpenClaw використовує `setupEntry` замість повної точки входу:**

- Channel вимкнений, але потребує поверхонь налаштування/онбордингу
- Channel увімкнений, але не налаштований
- Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Що має реєструвати `setupEntry`:**

- Об’єкт channel plugin (через `defineSetupPluginEntry`)
- Будь-які HTTP-маршрути, потрібні до початку listen Gateway
- Будь-які методи Gateway, потрібні під час запуску

Ці методи Gateway для запуску однаково мають уникати зарезервованих
просторів імен core admin, таких як `config.*` або `update.*`.

**Що НЕ має містити `setupEntry`:**

- Реєстрації CLI
- Фонові служби
- Важкі імпорти runtime (crypto, SDK)
- Методи Gateway, потрібні лише після запуску

### Вузькі імпорти допоміжних засобів налаштування

Для гарячих шляхів лише для налаштування віддавайте перевагу вузьким швам допоміжних засобів налаштування замість ширшого
пакета `plugin-sdk/setup`, якщо вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                      | Використовуйте для                                                                       | Ключові експорти                                                                                                                                                                                                                                                                             |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | допоміжні засоби runtime під час налаштування, які залишаються доступними в `setupEntry` / відкладеному запуску channel | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування облікових записів з урахуванням середовища                         | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`           | допоміжні засоби CLI/архіву/документації для налаштування/встановлення                   | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Використовуйте ширший шов `plugin-sdk/setup`, коли вам потрібен повний спільний
набір засобів налаштування, включно з допоміжними засобами patch конфігурації, такими як
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери patch для налаштування залишаються безпечними для гарячого шляху під час імпорту. Їхній вбудований
пошук поверхні контракту для просування одного облікового запису є лінивим, тому імпорт
`plugin-sdk/setup-runtime` не завантажує завчасно виявлення поверхні вбудованого контракту
до моменту фактичного використання адаптера.

### Просування одного облікового запису на боці channel

Коли channel оновлюється з конфігурації верхнього рівня для одного облікового запису до
`channels.<id>.accounts.*`, типова спільна поведінка — перемістити значення на рівні облікового запису, що просуваються,
до `accounts.default`.

Вбудовані channels можуть звузити або перевизначити це просування через свою
поверхню контракту налаштування:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які слід перемістити до
  просунутого облікового запису
- `namedAccountPromotionKeys`: якщо іменовані облікові записи вже існують, лише ці
  ключі переміщуються до просунутого облікового запису; спільні ключі policy/delivery залишаються в корені
  channel
- `resolveSingleAccountPromotionTarget(...)`: вибір існуючого облікового запису,
  який отримає просунуті значення

Поточний вбудований приклад — Matrix. Якщо вже існує рівно один іменований обліковий запис Matrix,
або якщо `defaultAccount` вказує на наявний неканонічний ключ,
такий як `Ops`, просування зберігає цей обліковий запис замість створення нового запису
`accounts.default`.

## Схема конфігурації

Конфігурація Plugin перевіряється за JSON Schema у вашому маніфесті. Користувачі
налаштовують plugins через:

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

Ваш plugin отримує цю конфігурацію як `api.pluginConfig` під час реєстрації.

Для конфігурації, специфічної для channel, використовуйте натомість розділ конфігурації channel:

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### Побудова схем конфігурації channel

Використовуйте `buildChannelConfigSchema` з `openclaw/plugin-sdk/core`, щоб перетворити
схему Zod на обгортку `ChannelConfigSchema`, яку перевіряє OpenClaw:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## Майстри налаштування

Channel plugins можуть надавати інтерактивні майстри налаштування для `openclaw onboard`.
Майстер — це об’єкт `ChannelSetupWizard` у `ChannelPlugin`:

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

Тип `ChannelSetupWizard` підтримує `credentials`, `textInputs`,
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` тощо.
Повні приклади дивіться у вбудованих пакетах plugin (наприклад, plugin Discord `src/channel.setup.ts`).

Для запитів списку дозволених DM, яким потрібен лише стандартний
потік `note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним допоміжним засобам налаштування
з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` і
`createNestedChannelParsedAllowFromPrompt(...)`.

Для блоків статусу налаштування channel, які відрізняються лише мітками, оцінками й необов’язковими
додатковими рядками, віддавайте перевагу `createStandardChannelSetupStatus(...)` з
`openclaw/plugin-sdk/setup` замість ручного створення однакового об’єкта `status` у
кожному plugin.

Для необов’язкових поверхонь налаштування, які мають з’являтися лише в певних контекстах, використовуйте
`createOptionalChannelSetupSurface` з `openclaw/plugin-sdk/channel-setup`:

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// Повертає { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` також надає низькорівневіші конструктори
`createOptionalChannelSetupAdapter(...)` і
`createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина
цієї поверхні необов’язкового встановлення.

Згенеровані необов’язкові адаптер/майстер завершуються без поблажок під час реальних записів конфігурації. Вони
повторно використовують одне повідомлення про обов’язковість встановлення в `validateInput`,
`applyAccountConfig` і `finalize`, а також додають посилання на документацію, коли задано `docsPath`.

Для UI налаштування, що працюють через бінарні файли, віддавайте перевагу спільним делегованим допоміжним засобам замість
копіювання однакової логіки бінарних файлів/статусу в кожен channel:

- `createDetectedBinaryStatus(...)` для блоків статусу, які відрізняються лише мітками,
  підказками, оцінками та виявленням бінарного файла
- `createCliPathTextInput(...)` для текстових полів на основі шляху
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і
  `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво перенаправляти до
  важчого повного майстра
- `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` має лише
  делегувати рішення `textInputs[*].shouldPrompt`

## Публікація та встановлення

**Зовнішні plugins:** опублікуйте в [ClawHub](/uk/tools/clawhub) або npm, а потім встановіть:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw спочатку пробує ClawHub і автоматично переходить до npm у разі невдачі. Ви також можете
явно примусово використати ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # Лише ClawHub
```

Відповідного перевизначення `npm:` немає. Використовуйте звичайну специфікацію пакета npm, коли
хочете шлях npm після резервного переходу з ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins у репозиторії:** розміщуйте їх у дереві workspace вбудованих plugin, і вони будуть автоматично
виявлені під час збірки.

**Користувачі можуть встановлювати:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Для встановлень із джерелом npm `openclaw plugins install` виконує
  `npm install --ignore-scripts` (без lifecycle-скриптів). Зберігайте дерева залежностей plugin
  чистими JS/TS і уникайте пакетів, які потребують збірок `postinstall`.
</Info>

Вбудовані plugins, що належать OpenClaw, — єдиний виняток для відновлення під час запуску: коли
пакетне встановлення бачить один із них увімкненим через конфігурацію plugin, застарілу конфігурацію channel або
його вбудований маніфест із увімкненням за замовчуванням, запуск установлює відсутні
залежності runtime цього plugin перед імпортом. Сторонні plugins не повинні покладатися на встановлення під час запуску;
продовжуйте використовувати явний інсталятор plugin.

## Пов’язане

- [SDK Entry Points](/uk/plugins/sdk-entrypoints) -- `definePluginEntry` і `defineChannelPluginEntry`
- [Plugin Manifest](/uk/plugins/manifest) -- повний довідник щодо схеми маніфесту
- [Building Plugins](/uk/plugins/building-plugins) -- покроковий посібник для початку роботи
