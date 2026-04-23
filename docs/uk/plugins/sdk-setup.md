---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Вам потрібно зрозуміти різницю між `setup-entry.ts` та `index.ts`
    - Ви визначаєте схеми конфігурації plugin або метадані `openclaw` у `package.json`
sidebarTitle: Setup and Config
summary: Майстри налаштування, `setup-entry.ts`, схеми конфігурації та метадані `package.json`
title: Налаштування Plugin та конфігурація
x-i18n:
    generated_at: "2026-04-23T05:16:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: ccdafb9a562353a7851fcd47bbc382961a449f5d645362c800f64c60579ce7b2
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Налаштування Plugin та конфігурація

Довідник щодо пакування plugin (`package.json` metadata), маніфестів
(`openclaw.plugin.json`), записів налаштування та схем конфігурації.

<Tip>
  **Шукаєте покроковий посібник?** Практичні інструкції охоплюють пакування в контексті:
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

**Provider plugin / базовий варіант публікації в ClawHub:**

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

Якщо ви публікуєте plugin зовні в ClawHub, поля `compat` і `build`
є обов’язковими. Канонічні фрагменти для публікації знаходяться в
`docs/snippets/plugin-publish/`.

### Поля `openclaw`

| Поле         | Тип        | Опис                                                                                                                      |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Файли точок входу (відносно кореня пакета)                                                                                |
| `setupEntry` | `string`   | Полегшений запис лише для налаштування (необов’язково)                                                                    |
| `channel`    | `object`   | Метадані каталогу каналів для налаштування, вибору, швидкого старту та поверхонь статусу                                  |
| `providers`  | `string[]` | Ідентифікатори провайдерів, зареєстровані цим plugin                                                                      |
| `install`    | `object`   | Підказки для встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Прапорці поведінки під час запуску                                                                                        |

### `openclaw.channel`

`openclaw.channel` — це недорогі метадані пакета для виявлення каналів і
поверхонь налаштування до завантаження runtime.

| Поле                                   | Тип        | Що це означає                                                               |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор каналу.                                            |
| `label`                                | `string`   | Основна назва каналу.                                                       |
| `selectionLabel`                       | `string`   | Назва у виборі/налаштуванні, якщо вона має відрізнятися від `label`.        |
| `detailLabel`                          | `string`   | Додаткова детальна назва для багатших каталогів каналів і поверхонь статусу. |
| `docsPath`                             | `string`   | Шлях до документації для посилань у налаштуванні та виборі.                 |
| `docsLabel`                            | `string`   | Назва для посилань на документацію, якщо вона має відрізнятися від ідентифікатора каналу. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                      |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                     |
| `aliases`                              | `string[]` | Додаткові псевдоніми для пошуку каналу.                                     |
| `preferOver`                           | `string[]` | Ідентифікатори plugin/каналів із нижчим пріоритетом, які цей канал має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва піктограми/system-image для каталогів UI каналу.        |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями на документацію в поверхнях вибору.         |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях до документації безпосередньо замість підписаного посилання в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, що додаються в тексті вибору.                      |
| `markdownCapable`                      | `boolean`  | Позначає канал як сумісний із markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Керування видимістю каналу для налаштування, списків налаштованих елементів і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Вмикає цей канал у стандартний потік налаштування quickstart `allowFrom`.   |
| `forceAccountBinding`                  | `boolean`  | Вимагає явної прив’язки облікового запису, навіть коли існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Надає перевагу пошуку сесії під час визначення цілей оголошення для цього каналу. |

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

- `configured`: включати канал до поверхонь переліку налаштованих елементів/статусу
- `setup`: включати канал до інтерактивних засобів вибору налаштування/конфігурації
- `docs`: позначати канал як публічно видимий у поверхнях документації/навігації

`showConfigured` і `showInSetup` усе ще підтримуються як застарілі псевдоніми. Надавайте перевагу
`exposure`.

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                  | Що це означає                                                                  |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `npmSpec`                    | `string`             | Канонічний npm spec для потоків встановлення/оновлення.                        |
| `localPath`                  | `string`             | Локальний шлях встановлення для розробки або вбудованого plugin.               |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва варіанти.                    |
| `minHostVersion`             | `string`             | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z`.                     |
| `expectedIntegrity`          | `string`             | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для фіксованих встановлень. |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення вбудованих plugin відновлюватися після окремих збоїв через застарілу конфігурацію. |

Інтерактивний онбординг також використовує `openclaw.install` для поверхонь
встановлення на вимогу. Якщо ваш plugin показує варіанти авторизації провайдера або
метадані налаштування/каталогу каналу до завантаження runtime,
онбординг може показати цей вибір, запропонувати npm чи локальне встановлення,
встановити або ввімкнути plugin, а потім продовжити вибраний
потік. Варіанти онбордингу через npm вимагають довірених метаданих каталогу з точним
значенням `npmSpec` версії та `expectedIntegrity`; нефіксовані назви пакетів і dist-tags
не пропонуються для автоматичного встановлення під час онбордингу. Зберігайте метадані
«що показувати» в `openclaw.plugin.json`, а метадані «як це встановити» — у
`package.json`.

Якщо задано `minHostVersion`, і встановлення, і завантаження реєстру маніфестів
застосовують цю вимогу. Старіші хости пропускають plugin; недійсні рядки версій відхиляються.

Для фіксованих npm-встановлень зберігайте точну версію в `npmSpec` і додавайте
очікувану цілісність артефакту:

```json
{
  "openclaw": {
    "install": {
      "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
      "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
      "defaultChoice": "npm"
    }
  }
}
```

`allowInvalidConfigRecovery` не є загальним обходом для зламаних конфігурацій. Це
призначено лише для вузьких сценаріїв відновлення вбудованих plugin, щоб перевстановлення/налаштування
могло виправити відомі залишки після оновлення, як-от відсутній шлях до вбудованого plugin або застарілий запис `channels.<id>`
для цього самого plugin. Якщо конфігурація зламана з не пов’язаних причин, встановлення
усе одно завершується безпечною відмовою та повідомляє оператору виконати `openclaw doctor --fix`.

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

Коли цю опцію ввімкнено, OpenClaw завантажує лише `setupEntry` на фазі запуску
до початку прослуховування, навіть для вже налаштованих каналів. Повний запис завантажується після того,
як Gateway починає прослуховування.

<Warning>
  Вмикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все,
  що потрібно Gateway до початку прослуховування (реєстрація каналу, HTTP-маршрути,
  методи Gateway). Якщо повний запис володіє необхідними можливостями запуску, зберігайте
  стандартну поведінку.
</Warning>

Якщо ваш запис налаштування/повний запис реєструє RPC-методи Gateway, залишайте їх на
префіксі, специфічному для plugin. Зарезервовані простори назв адміністратора ядра (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються під контролем ядра й завжди зіставляються
з `operator.admin`.

## Маніфест plugin

Кожен native plugin має постачати `openclaw.plugin.json` у корені пакета.
OpenClaw використовує його для валідації конфігурації без виконання коду plugin.

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

Навіть plugins без конфігурації мають постачати схему. Порожня схема є валідною:

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

## Публікація в ClawHub

Для пакетів plugin використовуйте команду ClawHub, призначену саме для пакетів:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Застарілий псевдонім публікації лише для skills призначений для Skills. Пакети plugin
завжди мають використовувати `clawhub package publish`.

## Запис налаштування

Файл `setup-entry.ts` — це полегшена альтернатива `index.ts`, яку
OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, відновлення конфігурації,
перевірка вимкнених каналів).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу уникнути завантаження важкого runtime-коду (криптобібліотек, CLI-реєстрацій,
фонових сервісів) під час потоків налаштування.

Вбудовані workspace-канали, які тримають безпечні для налаштування експорти в sidecar-модулях, можуть
використовувати `defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract` замість
`defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов’язковий
експорт `runtime`, щоб wiring runtime під час налаштування залишався легким і явним.

**Коли OpenClaw використовує `setupEntry` замість повного запису:**

- Канал вимкнено, але потрібні поверхні налаштування/онбордингу
- Канал увімкнено, але не налаштовано
- Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Що має реєструвати `setupEntry`:**

- Об’єкт channel plugin (через `defineSetupPluginEntry`)
- Будь-які HTTP-маршрути, потрібні до початку прослуховування Gateway
- Будь-які методи Gateway, потрібні під час запуску

Ці методи Gateway для запуску все одно мають уникати зарезервованих просторів
назв адміністратора ядра, таких як `config.*` або `update.*`.

**Що НЕ має містити `setupEntry`:**

- CLI-реєстрації
- Фонові сервіси
- Важкі runtime-імпорти (crypto, SDK)
- Методи Gateway, потрібні лише після запуску

### Вузькі імпорти допоміжних засобів налаштування

Для гарячих шляхів лише налаштування надавайте перевагу вузьким seam-допоміжним засобам налаштування замість ширшого
парасолькового `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                       | Використовуйте для                                                                    | Ключові експорти                                                                                                                                                                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | допоміжні runtime-засоби для часу налаштування, які лишаються доступними в `setupEntry` / під час відкладеного запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування облікових записів із урахуванням середовища                     | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                        |
| `plugin-sdk/setup-tools`           | допоміжні CLI/archive/docs-засоби для налаштування/встановлення                      | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Використовуйте ширший seam `plugin-sdk/setup`, коли вам потрібен повний спільний
набір інструментів налаштування, включно з допоміжними засобами для латання конфігурації, такими як
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери латання налаштування лишаються безпечними для імпорту на гарячому шляху. Їхній вбудований
відкладений пошук поверхні контракту просування одного облікового запису є lazy, тому імпорт
`plugin-sdk/setup-runtime` не виконує завчасне завантаження виявлення поверхні вбудованого контракту до того, як адаптер фактично буде використано.

### Просування одного облікового запису, кероване каналом

Коли канал оновлюється з верхньорівневої конфігурації одного облікового запису до
`channels.<id>.accounts.*`, типовою спільною поведінкою є переміщення значень
області облікового запису, що просуваються, у `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це просування через свою поверхню
контракту налаштування:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які слід перемістити до
  просунутого облікового запису
- `namedAccountPromotionKeys`: якщо іменовані облікові записи вже існують, лише ці
  ключі переміщуються до просунутого облікового запису; спільні ключі policy/delivery залишаються в корені
  каналу
- `resolveSingleAccountPromotionTarget(...)`: вибір наявного облікового запису,
  який отримає просунуті значення

Matrix є поточним вбудованим прикладом. Якщо вже існує рівно один іменований обліковий запис Matrix,
або якщо `defaultAccount` вказує на наявний неканонічний ключ, наприклад
`Ops`, просування зберігає цей обліковий запис замість створення нового запису
`accounts.default`.

## Схема конфігурації

Конфігурація plugin проходить валідацію за JSON Schema у вашому маніфесті. Користувачі
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

Під час реєстрації ваш plugin отримує цю конфігурацію як `api.pluginConfig`.

Для конфігурації, специфічної для каналу, використовуйте натомість розділ конфігурації каналу:

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

### Побудова схем конфігурації каналу

Використовуйте `buildChannelConfigSchema` з `openclaw/plugin-sdk/core`, щоб перетворити
схему Zod на обгортку `ChannelConfigSchema`, яку OpenClaw валідує:

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
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` та інші можливості.
Див. пакети вбудованих plugin (наприклад, plugin Discord `src/channel.setup.ts`), щоб ознайомитися з
повними прикладами.

Для запитів allowlist у DM, яким потрібен лише стандартний потік
`note -> prompt -> parse -> merge -> patch`, надавайте перевагу спільним допоміжним засобам налаштування
з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` і
`createNestedChannelParsedAllowFromPrompt(...)`.

Для блоків статусу налаштування каналу, які відрізняються лише назвами, оцінками та необов’язковими
додатковими рядками, надавайте перевагу `createStandardChannelSetupStatus(...)` з
`openclaw/plugin-sdk/setup` замість ручного створення того самого об’єкта `status` у
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
// Returns { setupAdapter, setupWizard }
```

`plugin-sdk/channel-setup` також надає lower-level
білдери `createOptionalChannelSetupAdapter(...)` і
`createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина
цієї необов’язкової поверхні встановлення.

Згенеровані необов’язкові adapter/wizard завершуються безпечною відмовою на реальних записах конфігурації. Вони
повторно використовують одне повідомлення про необхідність встановлення в `validateInput`,
`applyAccountConfig` і `finalize`, а також додають посилання на документацію, якщо задано `docsPath`.

Для UI налаштування, що працюють із двійковими файлами, надавайте перевагу спільним делегованим допоміжним засобам замість
копіювання тієї самої логіки двійкових файлів/статусу в кожен канал:

- `createDetectedBinaryStatus(...)` для блоків статусу, які відрізняються лише назвами,
  підказками, оцінками та визначенням двійкового файла
- `createCliPathTextInput(...)` для текстових полів на основі шляху
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і
  `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво передавати керування
  важчому повному майстру
- `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` має лише
  делегувати рішення `textInputs[*].shouldPrompt`

## Публікація та встановлення

**Зовнішні plugins:** опублікуйте в [ClawHub](/uk/tools/clawhub) або npm, а потім встановіть:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw спочатку намагається використати ClawHub і автоматично переходить до npm у разі невдачі. Ви також можете
явно примусово використати ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # лише ClawHub
```

Відповідного перевизначення `npm:` не існує. Використовуйте звичайний npm package spec, коли
потрібен шлях npm після переходу з ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins у репозиторії:** розмістіть їх у дереві workspace вбудованих plugin, і вони автоматично
виявлятимуться під час збірки.

**Користувачі можуть встановити:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Для встановлень із npm `openclaw plugins install` виконує
  `npm install --ignore-scripts` (без lifecycle scripts). Підтримуйте дерева залежностей plugin
  чистими JS/TS і уникайте пакетів, які потребують збірок через `postinstall`.
</Info>

Вбудовані plugins, якими володіє OpenClaw, — єдиний виняток для відновлення під час запуску: коли
пакетне встановлення бачить один із них увімкненим через конфігурацію plugin, застарілу конфігурацію каналу або
його вбудований маніфест із увімкненням за замовчуванням, запуск встановлює відсутні
runtime-залежності цього plugin перед імпортом. Сторонні plugins не повинні покладатися на
встановлення під час запуску; і далі використовуйте явний інсталятор plugin.

## Пов’язане

- [SDK Entry Points](/uk/plugins/sdk-entrypoints) -- `definePluginEntry` і `defineChannelPluginEntry`
- [Plugin Manifest](/uk/plugins/manifest) -- повний довідник щодо схеми маніфесту
- [Building Plugins](/uk/plugins/building-plugins) -- покроковий посібник для початку роботи
