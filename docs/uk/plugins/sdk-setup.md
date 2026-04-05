---
read_when:
    - Ви додаєте майстер налаштування до плагіна
    - Вам потрібно зрозуміти різницю між setup-entry.ts і index.ts
    - Ви визначаєте schema конфігурації плагіна або метадані openclaw у package.json
sidebarTitle: Setup and Config
summary: Майстри налаштування, setup-entry.ts, schema конфігурації та метадані package.json
title: Налаштування та конфігурація плагіна
x-i18n:
    generated_at: "2026-04-05T18:13:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 68fda27be1c89ea6ba906833113e9190ddd0ab358eb024262fb806746d54f7bf
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Налаштування та конфігурація плагіна

Довідник із пакування плагінів (метадані `package.json`), маніфестів
(`openclaw.plugin.json`), setup entries і schema конфігурації.

<Tip>
  **Шукаєте покрокове пояснення?** У посібниках how-to розглядається пакування в контексті:
  [Плагіни каналів](/plugins/sdk-channel-plugins#step-1-package-and-manifest) і
  [Плагіни провайдерів](/plugins/sdk-provider-plugins#step-1-package-and-manifest).
</Tip>

## Метадані пакета

Ваш `package.json` має містити поле `openclaw`, яке повідомляє системі плагінів, що
саме надає ваш плагін:

**Плагін каналу:**

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

**Плагін провайдера / базовий варіант для публікації в ClawHub:**

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

Якщо ви публікуєте плагін зовні в ClawHub, ці поля `compat` і `build`
є обов’язковими. Канонічні фрагменти для публікації розміщено в
`docs/snippets/plugin-publish/`.

### Поля `openclaw`

| Поле        | Тип        | Опис                                                                                                   |
| ----------- | ---------- | ------------------------------------------------------------------------------------------------------ |
| `extensions` | `string[]` | Файли entry point'ів (відносно кореня пакета)                                                          |
| `setupEntry` | `string`   | Полегшений запис лише для налаштування (необов’язково)                                                 |
| `channel`    | `object`   | Метадані каталогу каналів для налаштування, пікера, quickstart і поверхонь статусу                    |
| `providers`  | `string[]` | Id провайдерів, які реєструє цей плагін                                                                |
| `install`    | `object`   | Підказки для встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Прапорці поведінки під час запуску                                                                     |

### `openclaw.channel`

`openclaw.channel` — це недорогі метадані пакета для виявлення каналу і поверхонь
налаштування до завантаження середовища виконання.

| Поле                                   | Тип        | Що це означає                                                                |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний id каналу.                                                       |
| `label`                                | `string`   | Основна мітка каналу.                                                       |
| `selectionLabel`                       | `string`   | Мітка для пікера/налаштування, якщо вона має відрізнятися від `label`.      |
| `detailLabel`                          | `string`   | Додаткова мітка для докладніших каталогів каналів і поверхонь статусу.      |
| `docsPath`                             | `string`   | Шлях до документації для посилань у налаштуванні та виборі.                 |
| `docsLabel`                            | `string`   | Заміна мітки для посилань на документацію, якщо вона має відрізнятися від id каналу. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                      |
| `order`                                | `number`   | Порядок сортування в каталогах каналів.                                     |
| `aliases`                              | `string[]` | Додаткові псевдоніми для пошуку каналу.                                     |
| `preferOver`                           | `string[]` | Менш пріоритетні id плагінів/каналів, які цей канал має перевершувати.      |
| `systemImage`                          | `string`   | Необов’язкова назва icon/system-image для каталогів UI каналів.             |
| `selectionDocsPrefix`                  | `string`   | Префіксний текст перед посиланнями на документацію на поверхнях вибору.     |
| `selectionDocsOmitLabel`               | `boolean`  | Показує шлях до документації напряму замість підписаного посилання в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, що додаються до тексту вибору.                     |
| `markdownCapable`                      | `boolean`  | Позначає канал як такий, що підтримує markdown для вихідного форматування.  |
| `showConfigured`                       | `boolean`  | Керує тим, чи показують поверхні списку налаштованих каналів цей канал.     |
| `quickstartAllowFrom`                  | `boolean`  | Додає цей канал до стандартного потоку налаштування quickstart `allowFrom`. |
| `forceAccountBinding`                  | `boolean`  | Вимагає явної прив’язки облікового запису, навіть якщо існує лише один запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Віддає перевагу пошуку сесії під час визначення announce targets для цього каналу. |

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
      "quickstartAllowFrom": true
    }
  }
}
```

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                  | Що це означає                                                                   |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Канонічна npm-специфікація для потоків встановлення/оновлення.                  |
| `localPath`                  | `string`             | Локальний шлях встановлення для розробки або вбудованого пакета.                |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, якщо доступні обидва варіанти.                     |
| `minHostVersion`             | `string`             | Мінімальна підтримувана версія OpenClaw у формі `>=x.y.z`.                      |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення вбудованих плагінів відновлюватися після певних збоїв застарілої конфігурації. |

Якщо задано `minHostVersion`, його перевіряють і потоки встановлення, і
завантаження реєстру маніфестів. Старіші хости пропускають плагін; некоректні
рядки версій відхиляються.

`allowInvalidConfigRecovery` не є загальним обходом для зламаних конфігурацій. Це
лише вузький механізм відновлення для вбудованих плагінів, щоб перевстановлення/налаштування
могло виправити відомі залишки після оновлення, як-от відсутній шлях до
вбудованого плагіна або застарілий запис `channels.<id>` для цього ж плагіна.
Якщо конфігурація зламана з непов’язаних причин, встановлення все одно завершується fail-closed і
радить оператору запустити `openclaw doctor --fix`.

### Відкладене повне завантаження

Плагіни каналів можуть увімкнути відкладене завантаження так:

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

Коли це ввімкнено, OpenClaw під час фази запуску до початку прослуховування
завантажує лише `setupEntry`, навіть для вже налаштованих каналів. Повний entry
завантажується після того, як gateway починає слухати.

<Warning>
  Вмикайте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все,
  що gateway потребує до початку прослуховування (реєстрацію каналу, HTTP-маршрути,
  методи gateway). Якщо необхідні можливості запуску належать повному entry,
  залишайте типову поведінку.
</Warning>

Якщо ваш setup/full entry реєструє gateway RPC methods, використовуйте для них
префікс, специфічний для плагіна. Зарезервовані простори імен основного admin (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються у власності core і завжди
визначаються як `operator.admin`.

## Маніфест плагіна

Кожен власний плагін має постачатися з `openclaw.plugin.json` у корені пакета.
OpenClaw використовує цей файл для валідації конфігурації без виконання коду плагіна.

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

Для плагінів каналів додайте `kind` і `channels`:

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

Навіть плагіни без конфігурації мають постачатися зі schema. Порожня schema є коректною:

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

Повний довідник schema див. у [Маніфесті плагіна](/plugins/manifest).

## Публікація в ClawHub

Для пакетів плагінів використовуйте команду ClawHub, специфічну для пакетів:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Застарілий псевдонім публікації лише для Skills призначений для Skills. Пакети плагінів
завжди мають використовувати `clawhub package publish`.

## Setup entry

Файл `setup-entry.ts` — це полегшена альтернатива `index.ts`, яку
OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, відновлення конфігурації,
перевірка вимкненого каналу).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дозволяє уникнути завантаження важкого коду runtime (криптобібліотек, CLI-реєстрацій,
фонових сервісів) під час потоків налаштування.

**Коли OpenClaw використовує `setupEntry` замість повного entry:**

- Канал вимкнено, але потрібні поверхні налаштування/онбордингу
- Канал увімкнено, але не налаштовано
- Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Що має реєструвати `setupEntry`:**

- Об’єкт плагіна каналу (через `defineSetupPluginEntry`)
- Будь-які HTTP-маршрути, потрібні до початку прослуховування gateway
- Будь-які методи gateway, потрібні під час запуску

Ці стартові методи gateway усе одно мають уникати зарезервованих просторів імен
основного admin, таких як `config.*` або `update.*`.

**Що НЕ має містити `setupEntry`:**

- CLI-реєстрації
- Фонові сервіси
- Важкі runtime-імпорти (crypto, SDK)
- Методи gateway, потрібні лише після запуску

### Вузькі імпорти setup helpers

Для гарячих шляхів лише для налаштування віддавайте перевагу вузьким seams setup helper'ів замість ширшого
umbrella `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                      | Для чого використовувати                                                              | Ключові експорти                                                                                                                                                                                                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`        | runtime helpers на етапі налаштування, які лишаються доступними в `setupEntry` / під час відкладеного запуску каналу | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | environment-aware account setup adapters                                              | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                       |
| `plugin-sdk/setup-tools`          | CLI/archive/docs helpers для setup/install                                             | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                              |

Використовуйте ширший seam `plugin-sdk/setup`, коли вам потрібен повний спільний
набір інструментів для налаштування, зокрема helpers для patch конфігурації, як-от
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери patch налаштування лишаються безпечними для імпорту на гарячому шляху. Їхній вбудований
лінивий пошук contract surface для підвищення single-account не виконується завчасно, тому імпорт
`plugin-sdk/setup-runtime` не призводить до раннього завантаження виявлення bundled contract-surface
до фактичного використання адаптера.

### Підвищення single-account, що належить каналу

Коли канал оновлюється з top-level конфігурації одного облікового запису до
`channels.<id>.accounts.*`, типова спільна поведінка полягає в перенесенні значень
на рівні облікового запису до `accounts.default`.

Вбудовані канали можуть звузити або перевизначити це підвищення через свій
setup contract surface:

- `singleAccountKeysToMove`: додаткові top-level ключі, які слід перенести до
  підвищеного облікового запису
- `namedAccountPromotionKeys`: коли іменовані облікові записи вже існують, лише ці
  ключі переносяться до підвищеного облікового запису; спільні policy/delivery ключі лишаються на
  корені каналу
- `resolveSingleAccountPromotionTarget(...)`: вибір наявного облікового запису,
  який має отримати підвищені значення

Поточний вбудований приклад — Matrix. Якщо вже існує рівно один іменований обліковий запис Matrix,
або якщо `defaultAccount` вказує на наявний неканонічний ключ, наприклад `Ops`,
підвищення зберігає цей обліковий запис замість створення нового запису
`accounts.default`.

## Schema конфігурації

Конфігурація плагіна проходить валідацію за JSON Schema у вашому маніфесті. Користувачі
налаштовують плагіни через:

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

Ваш плагін отримує цю конфігурацію як `api.pluginConfig` під час реєстрації.

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

### Побудова schema конфігурації каналу

Використовуйте `buildChannelConfigSchema` з `openclaw/plugin-sdk/core`, щоб перетворити
schema Zod на обгортку `ChannelConfigSchema`, яку валідує OpenClaw:

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

Плагіни каналів можуть надавати інтерактивні майстри налаштування для `openclaw onboard`.
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
`dmPolicy`, `allowFrom`, `groupAccess`, `prepare`, `finalize` та інше.
Повні приклади див. у пакетах вбудованих плагінів (наприклад, у Discord plugin `src/channel.setup.ts`).

Для prompt'ів списку дозволів DM, яким потрібен лише стандартний потік
`note -> prompt -> parse -> merge -> patch`, віддавайте перевагу спільним setup
helper'ам з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` і
`createNestedChannelParsedAllowFromPrompt(...)`.

Для блоків статусу налаштування каналу, які відрізняються лише мітками, оцінками та необов’язковими
додатковими рядками, віддавайте перевагу `createStandardChannelSetupStatus(...)` з
`openclaw/plugin-sdk/setup` замість ручного створення однакового об’єкта `status` у
кожному плагіні.

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

Згенеровані необов’язкові adapter/wizard працюють у режимі fail-closed під час реального запису конфігурації. Вони
повторно використовують одне повідомлення про необхідність встановлення у `validateInput`,
`applyAccountConfig` і `finalize`, а також додають посилання на документацію, якщо задано `docsPath`.

Для UI налаштування на основі бінарних файлів віддавайте перевагу спільним delegated helper'ам замість
копіювання однакової логіки binary/status у кожен канал:

- `createDetectedBinaryStatus(...)` для блоків статусу, що відрізняються лише мітками,
  підказками, оцінками та виявленням бінарного файлу
- `createCliPathTextInput(...)` для текстових полів, прив’язаних до шляху
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і
  `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво переспрямовувати
  до важчого повного wizard
- `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` потрібно лише
  делегувати рішення `textInputs[*].shouldPrompt`

## Публікація та встановлення

**Зовнішні плагіни:** опублікуйте в [ClawHub](/tools/clawhub) або npm, а потім установіть:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw спочатку пробує ClawHub і автоматично переходить до npm. Ви також можете
явно примусово використовувати ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # лише ClawHub
```

Відповідного перевизначення `npm:` немає. Використовуйте звичайну npm-spec пакета, коли
хочете шлях npm після fallback з ClawHub:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**Плагіни в репозиторії:** розміщуйте їх у дереві workspace вбудованих плагінів, і вони автоматично
виявлятимуться під час збирання.

**Користувачі можуть установлювати:**

```bash
openclaw plugins install <package-name>
```

<Info>
  Для встановлень із npm `openclaw plugins install` виконує
  `npm install --ignore-scripts` (без lifecycle scripts). Зберігайте дерева
  залежностей плагіна чистими JS/TS і уникайте пакетів, які потребують збирання через `postinstall`.
</Info>

## Пов’язане

- [Точки входу SDK](/plugins/sdk-entrypoints) -- `definePluginEntry` і `defineChannelPluginEntry`
- [Маніфест плагіна](/plugins/manifest) -- повний довідник schema маніфесту
- [Створення плагінів](/plugins/building-plugins) -- покроковий посібник для початку роботи
