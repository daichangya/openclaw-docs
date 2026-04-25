---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Вам потрібно зрозуміти різницю між `setup-entry.ts` і `index.ts`
    - Ви визначаєте схеми конфігурації Plugin або метадані `openclaw` у `package.json`
sidebarTitle: Setup and Config
summary: Майстри налаштування, `setup-entry.ts`, схеми конфігурації та метадані `package.json`
title: Налаштування Plugin та конфігурація
x-i18n:
    generated_at: "2026-04-25T00:26:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: d27bba27f8bd7b8469cfc9dc8d65b12242eef9e04e1c20e5192e51ada6512491
    source_path: plugins/sdk-setup.md
    workflow: 15
---

Довідник щодо пакування Plugin (метадані `package.json`), маніфестів
(`openclaw.plugin.json`), точок входу налаштування та схем конфігурації.

<Tip>
  **Потрібен покроковий посібник?** Практичні інструкції охоплюють пакування в контексті:
  [Channel Plugins](/uk/plugins/sdk-channel-plugins#step-1-package-and-manifest) і
  [Provider Plugins](/uk/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Ваш `package.json` має містити поле `openclaw`, яке повідомляє системі Plugin, що
надає ваш Plugin:

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

**Provider Plugin / базовий рівень публікації ClawHub:**

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

Якщо ви публікуєте Plugin зовні у ClawHub, ці поля `compat` і `build`
є обов’язковими. Канонічні фрагменти для публікації містяться в
`docs/snippets/plugin-publish/`.

### Поля `openclaw`

| Поле         | Тип        | Опис                                                                                                                    |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Файли точок входу (відносно кореня пакета)                                                                              |
| `setupEntry` | `string`   | Легка точка входу лише для налаштування (необов’язково)                                                                 |
| `channel`    | `object`   | Метадані каталогу Channel для налаштування, вибору, quickstart і поверхонь стану                                        |
| `providers`  | `string[]` | Ідентифікатори Provider, зареєстровані цим Plugin                                                                       |
| `install`    | `object`   | Підказки встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Прапори поведінки під час запуску                                                                                       |

### `openclaw.channel`

`openclaw.channel` — це недорогі метадані пакета для виявлення Channel і поверхонь
налаштування до завантаження runtime.

| Поле                                   | Тип        | Що це означає                                                               |
| -------------------------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор Channel.                                            |
| `label`                                | `string`   | Основна назва Channel.                                                       |
| `selectionLabel`                       | `string`   | Назва у виборі/налаштуванні, якщо вона має відрізнятися від `label`.         |
| `detailLabel`                          | `string`   | Додаткова назва для розширених каталогів Channel і поверхонь стану.          |
| `docsPath`                             | `string`   | Шлях до документації для посилань у налаштуванні та виборі.                  |
| `docsLabel`                            | `string`   | Назва для посилань на документацію, якщо вона має відрізнятися від id Channel. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                       |
| `order`                                | `number`   | Порядок сортування в каталогах Channel.                                      |
| `aliases`                              | `string[]` | Додаткові псевдоніми для пошуку Channel.                                     |
| `preferOver`                           | `string[]` | Ідентифікатори Plugin/Channel нижчого пріоритету, які цей Channel має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва іконки/system-image для UI-каталогів Channel.            |
| `selectionDocsPrefix`                  | `string`   | Текст-префікс перед посиланнями на документацію в поверхнях вибору.          |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях до документації напряму замість підписаного посилання в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, що додаються в тексті вибору.                       |
| `markdownCapable`                      | `boolean`  | Позначає, що Channel підтримує markdown для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Керування видимістю Channel для налаштування, списків налаштованого та документації. |
| `quickstartAllowFrom`                  | `boolean`  | Вмикає для цього Channel стандартний quickstart-потік налаштування `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Вимагає явного прив’язування облікового запису, навіть якщо існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Надає перевагу пошуку сесії під час визначення announce-target для цього Channel. |

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

- `configured`: включати Channel у поверхні списків налаштованого/стилю стану
- `setup`: включати Channel в інтерактивні засоби вибору налаштування/конфігурації
- `docs`: позначати Channel як публічний у поверхнях документації/навігації

`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Надавайте перевагу
`exposure`.

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                  | Що це означає                                                                    |
| ---------------------------- | -------------------- | --------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Канонічна специфікація npm для потоків встановлення/оновлення.                    |
| `localPath`                  | `string`             | Локальний шлях для розробки або вбудованого встановлення.                         |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва варіанти.                       |
| `minHostVersion`             | `string`             | Мінімальна підтримувана версія OpenClaw у форматі `>=x.y.z`.                      |
| `expectedIntegrity`          | `string`             | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для зафіксованих встановлень. |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення вбудованого Plugin відновлюватися після певних збоїв через застарілу конфігурацію. |

Інтерактивний онбординг також використовує `openclaw.install` для поверхонь
встановлення на вимогу. Якщо ваш Plugin надає варіанти автентифікації Provider або метадані
налаштування/каталогу Channel до завантаження runtime, онбординг може показати цей
вибір, запропонувати npm чи локальне встановлення, встановити або ввімкнути Plugin, а потім
продовжити вибраний потік. Для варіантів онбордингу через npm потрібні довірені метадані каталогу з
`npmSpec` реєстру; точні версії та `expectedIntegrity` є необов’язковими фіксаціями. Якщо
присутній `expectedIntegrity`, потоки встановлення/оновлення застосовують його перевірку. Зберігайте метадані
«що показувати» в `openclaw.plugin.json`, а метадані «як це встановлювати» —
у `package.json`.

Якщо задано `minHostVersion`, і потоки встановлення, і завантаження реєстру маніфестів
застосовують його. Старіші хости пропускають Plugin; неприпустимі рядки версій відхиляються.

Для зафіксованих встановлень npm зберігайте точну версію в `npmSpec` і додавайте
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

`allowInvalidConfigRecovery` — це не загальний обхід для зламаних конфігурацій. Він
призначений лише для вузького сценарію відновлення вбудованого Plugin, щоб перевстановлення/налаштування
могло виправити відомі залишки після оновлення, як-от відсутній шлях до вбудованого Plugin або застарілий запис `channels.<id>`
для цього самого Plugin. Якщо конфігурація зламана з інших причин, встановлення
все одно завершується безпечною відмовою і повідомляє оператору запустити `openclaw doctor --fix`.

### Відкладене повне завантаження

Channel Plugins можуть увімкнути відкладене завантаження так:

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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску
до початку прослуховування, навіть для вже налаштованих Channel. Повна точка входу завантажується після
того, як Gateway починає прослуховування.

<Warning>
  Увімкнюйте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все,
  що Gateway потребує до початку прослуховування (реєстрація Channel, HTTP-маршрути,
  методи Gateway). Якщо повна точка входу володіє обов’язковими можливостями запуску, залишайте
  типову поведінку.
</Warning>

Якщо ваша точка входу налаштування/повна точка входу реєструє методи Gateway RPC, зберігайте для них
префікс, специфічний для Plugin. Зарезервовані простори імен core admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності core і завжди зіставляються
з `operator.admin`.

## Маніфест Plugin

Кожен native Plugin має постачатися з `openclaw.plugin.json` у корені пакета.
OpenClaw використовує його для перевірки конфігурації без виконання коду Plugin.

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

Для Channel Plugins додайте `kind` і `channels`:

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

Навіть Plugins без конфігурації мають постачатися зі схемою. Порожня схема є коректною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Див. [Plugin Manifest](/uk/plugins/manifest) для повного довідника зі схеми.

## Публікація в ClawHub

Для пакетів Plugin використовуйте команду ClawHub, специфічну для пакетів:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Застарілий псевдонім публікації лише для skill призначений для Skills. Пакети Plugin завжди
мають використовувати `clawhub package publish`.

## Точка входу налаштування

Файл `setup-entry.ts` — це легка альтернатива `index.ts`, яку
OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, відновлення конфігурації,
перевірка вимкнених Channel).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу уникнути завантаження важкого runtime-коду (криптобібліотек, реєстрацій CLI,
фонових сервісів) під час потоків налаштування.

Вбудовані workspace Channel, які зберігають безпечні для налаштування експорти в sidecar-модулях, можуть
використовувати `defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract` замість
`defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов’язковий
експорт `runtime`, щоб підключення runtime під час налаштування залишалося легким і явним.

**Коли OpenClaw використовує `setupEntry` замість повної точки входу:**

- Channel вимкнений, але потребує поверхонь налаштування/онбордингу
- Channel увімкнений, але не налаштований
- Увімкнене відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Що має реєструвати `setupEntry`:**

- Об’єкт Channel Plugin (через `defineSetupPluginEntry`)
- Будь-які HTTP-маршрути, потрібні до початку прослуховування Gateway
- Будь-які методи Gateway, потрібні під час запуску

Ці методи Gateway для запуску все одно не повинні використовувати зарезервовані
простори імен core admin, такі як `config.*` або `update.*`.

**Чого НЕ має містити `setupEntry`:**

- Реєстрації CLI
- Фонові сервіси
- Важкі runtime-імпорти (crypto, SDK)
- Методи Gateway, потрібні лише після запуску

### Вузькі імпорти допоміжних засобів налаштування

Для гарячих шляхів лише налаштування надавайте перевагу вузьким швам допоміжних засобів налаштування замість ширшого
парасолькового `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                      | Використовуйте для                                                                         | Ключові експорти                                                                                                                                                                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`        | допоміжні засоби runtime під час налаштування, що залишаються доступними в `setupEntry` / відкладеному запуску Channel | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування облікових записів з урахуванням середовища                           | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`          | допоміжні засоби CLI/архівів/документації для налаштування/встановлення                   | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                               |

Використовуйте ширший шов `plugin-sdk/setup`, коли вам потрібен повний спільний
набір інструментів налаштування, включно з допоміжними засобами patch-конфігурації, такими як
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери patch для налаштування залишаються безпечними для гарячого шляху під час імпорту. Їхній вбудований
пошук поверхні контракту для просування одного облікового запису виконується ліниво, тому імпорт
`plugin-sdk/setup-runtime` не завантажує наперед виявлення поверхні вбудованого контракту
до фактичного використання адаптера.

### Просування одного облікового запису під керуванням Channel

Коли Channel переходить від верхньорівневої конфігурації одного облікового запису до
`channels.<id>.accounts.*`, типова спільна поведінка полягає в переміщенні
значень на рівні облікового запису, що просуваються, до `accounts.default`.

Вбудовані Channel можуть звузити або перевизначити це просування через свою
контрактну поверхню налаштування:

- `singleAccountKeysToMove`: додаткові верхньорівневі ключі, які слід перемістити до
  просунутого облікового запису
- `namedAccountPromotionKeys`: якщо іменовані облікові записи вже існують, лише ці
  ключі переміщуються до просунутого облікового запису; спільні ключі policy/delivery залишаються в корені
  Channel
- `resolveSingleAccountPromotionTarget(...)`: вибір наявного облікового запису,
  який отримає просунуті значення

Matrix — поточний вбудований приклад. Якщо вже існує рівно один іменований обліковий запис Matrix,
або якщо `defaultAccount` вказує на наявний неканонічний ключ,
наприклад `Ops`, просування зберігає цей обліковий запис замість створення нового
запису `accounts.default`.

## Схема конфігурації

Конфігурація Plugin перевіряється на відповідність JSON Schema у вашому маніфесті. Користувачі
налаштовують Plugins через:

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

Під час реєстрації ваш Plugin отримує цю конфігурацію як `api.pluginConfig`.

Для конфігурації, специфічної для Channel, використовуйте натомість розділ конфігурації Channel:

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

### Побудова схем конфігурації Channel

Використовуйте `buildChannelConfigSchema`, щоб перетворити схему Zod на
обгортку `ChannelConfigSchema`, яка використовується артефактами конфігурації під керуванням Plugin:

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

Для сторонніх Plugins контракт холодного шляху, як і раніше, залишається маніфестом Plugin:
віддзеркальте згенеровану JSON Schema в `openclaw.plugin.json#channelConfigs`, щоб
схема конфігурації, налаштування і UI-поверхні могли перевіряти `channels.<id>` без
завантаження runtime-коду.

## Майстри налаштування

Channel Plugins можуть надавати інтерактивні майстри налаштування для `openclaw onboard`.
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
Див. пакети вбудованих Plugins (наприклад, Plugin Discord `src/channel.setup.ts`) для
повних прикладів.

Для запитів DM allowlist, яким потрібен лише стандартний потік
`note -> prompt -> parse -> merge -> patch`, надавайте перевагу спільним допоміжним засобам налаштування
з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` і
`createNestedChannelParsedAllowFromPrompt(...)`.

Для блоків стану налаштування Channel, які відрізняються лише мітками, оцінками та необов’язковими
додатковими рядками, надавайте перевагу `createStandardChannelSetupStatus(...)` з
`openclaw/plugin-sdk/setup` замість ручного створення того самого об’єкта `status` у
кожному Plugin.

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

`plugin-sdk/channel-setup` також надає нижчорівневі конструктори
`createOptionalChannelSetupAdapter(...)` і
`createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина
цієї необов’язкової поверхні встановлення.

Згенеровані необов’язкові адаптер/майстер безпечно відмовляють під час реальних записів конфігурації. Вони
повторно використовують одне повідомлення про необхідність встановлення в `validateInput`,
`applyAccountConfig` і `finalize`, а також додають посилання на документацію, якщо задано `docsPath`.

Для UI налаштування, що працюють через binary, надавайте перевагу спільним делегованим допоміжним засобам замість
копіювання однакової логіки binary/стану в кожен Channel:

- `createDetectedBinaryStatus(...)` для блоків стану, які відрізняються лише мітками,
  підказками, оцінками та виявленням binary
- `createCliPathTextInput(...)` для текстових полів на основі шляхів
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і
  `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво переспрямовувати до
  важчого повного майстра
- `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` потрібно лише
  делегувати рішення `textInputs[*].shouldPrompt`

## Публікація та встановлення

**Зовнішні Plugins:** опублікуйте в [ClawHub](/uk/tools/clawhub) або npm, а потім встановіть:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw спочатку намагається використати ClawHub, а потім автоматично переходить до npm. Ви також можете
явно примусово використати ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # ClawHub only
```

Відповідного перевизначення `npm:` не існує. Використовуйте звичайну специфікацію npm-пакета, коли
вам потрібен шлях npm після fallback із ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Plugins у репозиторії:** розміщуйте в дереві workspace вбудованих Plugins, і вони автоматично
виявлятимуться під час збірки.

**Користувачі можуть встановити:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Для встановлень із npm `openclaw plugins install` виконує
  `npm install --ignore-scripts` (без lifecycle scripts). Підтримуйте дерево залежностей Plugin
  у чистому JS/TS і уникайте пакетів, що потребують збірок `postinstall`.
</Info>

Вбудовані Plugins під керуванням OpenClaw — єдиний виняток для відновлення під час запуску: коли
пакетоване встановлення бачить один із них увімкненим через конфігурацію Plugin, застарілу конфігурацію Channel або
його вбудований маніфест із типовим увімкненням, під час запуску встановлюються відсутні
runtime-залежності цього Plugin перед імпортом. Сторонні Plugins не повинні покладатися на
встановлення під час запуску; і надалі використовуйте явний інсталятор Plugin.

## Пов’язане

- [SDK Entry Points](/uk/plugins/sdk-entrypoints) -- `definePluginEntry` і `defineChannelPluginEntry`
- [Plugin Manifest](/uk/plugins/manifest) -- повний довідник зі схем маніфесту
- [Building Plugins](/uk/plugins/building-plugins) -- покроковий посібник для початку роботи
