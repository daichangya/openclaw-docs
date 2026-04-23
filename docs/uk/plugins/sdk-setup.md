---
read_when:
    - Ви додаєте майстер налаштування до Plugin
    - Вам потрібно зрозуміти різницю між setup-entry.ts і index.ts
    - Ви визначаєте схеми конфігурації plugin або метадані openclaw у package.json
sidebarTitle: Setup and Config
summary: Майстри налаштування, setup-entry.ts, схеми конфігурації та метадані package.json
title: Налаштування Plugin і конфігурація
x-i18n:
    generated_at: "2026-04-23T07:42:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 110cf9aa1bfaeb286d38963cfba2006502e853dd603a126d1c179cbc9b60aea1
    source_path: plugins/sdk-setup.md
    workflow: 15
---

# Налаштування Plugin і конфігурація

Довідник із пакування plugin (`package.json` метадані), маніфестів
(`openclaw.plugin.json`), точок входу налаштування та схем конфігурації.

<Tip>
  **Шукаєте покроковий приклад?** Покрокові інструкції описують пакування в контексті:
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

**Provider plugin / базовий варіант публікації ClawHub:**

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

Якщо ви публікуєте plugin зовнішньо в ClawHub, ці поля `compat` і `build`
є обов’язковими. Канонічні фрагменти для публікації розміщені в
`docs/snippets/plugin-publish/`.

### Поля `openclaw`

| Поле         | Тип        | Опис                                                                                                                            |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | Файли точок входу (відносно кореня пакета)                                                                                      |
| `setupEntry` | `string`   | Полегшена точка входу лише для налаштування (необов’язково)                                                                     |
| `channel`    | `object`   | Метадані каталогу channel для налаштування, вибору, швидкого старту та поверхонь статусу                                       |
| `providers`  | `string[]` | Ідентифікатори provider, зареєстрованих цим plugin                                                                              |
| `install`    | `object`   | Підказки встановлення: `npmSpec`, `localPath`, `defaultChoice`, `minHostVersion`, `expectedIntegrity`, `allowInvalidConfigRecovery` |
| `startup`    | `object`   | Прапорці поведінки під час запуску                                                                                              |

### `openclaw.channel`

`openclaw.channel` — це недорогі метадані пакета для виявлення channel і поверхонь
налаштування до завантаження runtime.

| Поле                                   | Тип        | Що це означає                                                               |
| -------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| `id`                                   | `string`   | Канонічний ідентифікатор channel.                                           |
| `label`                                | `string`   | Основний ярлик channel.                                                     |
| `selectionLabel`                       | `string`   | Ярлик у засобі вибору/налаштування, якщо він має відрізнятися від `label`.  |
| `detailLabel`                          | `string`   | Вторинний ярлик деталей для багатших каталогів channel і поверхонь статусу. |
| `docsPath`                             | `string`   | Шлях до документації для посилань із налаштування та вибору.                |
| `docsLabel`                            | `string`   | Ярлик для посилань на документацію, якщо він має відрізнятися від id channel. |
| `blurb`                                | `string`   | Короткий опис для онбордингу/каталогу.                                      |
| `order`                                | `number`   | Порядок сортування в каталогах channel.                                     |
| `aliases`                              | `string[]` | Додаткові псевдоніми для пошуку під час вибору channel.                     |
| `preferOver`                           | `string[]` | Ідентифікатори plugin/channel з нижчим пріоритетом, які цей channel має випереджати. |
| `systemImage`                          | `string`   | Необов’язкова назва піктограми/system-image для каталогів UI channel.       |
| `selectionDocsPrefix`                  | `string`   | Префіксний текст перед посиланнями на документацію в поверхнях вибору.      |
| `selectionDocsOmitLabel`               | `boolean`  | Показувати шлях документації напряму замість підписаного посилання в тексті вибору. |
| `selectionExtras`                      | `string[]` | Додаткові короткі рядки, додані до тексту вибору.                           |
| `markdownCapable`                      | `boolean`  | Позначає channel як такий, що підтримує markdown, для рішень щодо вихідного форматування. |
| `exposure`                             | `object`   | Керування видимістю channel для налаштування, списків налаштованих елементів і поверхонь документації. |
| `quickstartAllowFrom`                  | `boolean`  | Додає цей channel до стандартного потоку швидкого старту `allowFrom`.       |
| `forceAccountBinding`                  | `boolean`  | Вимагає явного прив’язування облікового запису, навіть якщо існує лише один обліковий запис. |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | Надає перевагу пошуку session під час визначення announce target для цього channel. |

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

- `configured`: включати channel до поверхонь списків налаштованих елементів/стану
- `setup`: включати channel до інтерактивних засобів вибору налаштування/конфігурації
- `docs`: позначати channel як публічно видимий на поверхнях документації/навігації

`showConfigured` і `showInSetup` залишаються підтримуваними як застарілі псевдоніми. Надавайте перевагу
`exposure`.

### `openclaw.install`

`openclaw.install` — це метадані пакета, а не метадані маніфесту.

| Поле                         | Тип                  | Що це означає                                                                    |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | Канонічна специфікація npm для потоків встановлення/оновлення.                   |
| `localPath`                  | `string`             | Локальний шлях для розробки або вбудованого встановлення.                        |
| `defaultChoice`              | `"npm"` \| `"local"` | Бажане джерело встановлення, коли доступні обидва варіанти.                      |
| `minHostVersion`             | `string`             | Мінімально підтримувана версія OpenClaw у формі `>=x.y.z`.                       |
| `expectedIntegrity`          | `string`             | Очікуваний рядок цілісності npm dist, зазвичай `sha512-...`, для зафіксованих встановлень. |
| `allowInvalidConfigRecovery` | `boolean`            | Дозволяє потокам перевстановлення вбудованих plugin відновлюватися після певних збоїв застарілої конфігурації. |

Інтерактивний онбординг також використовує `openclaw.install` для поверхонь
встановлення на вимогу. Якщо ваш plugin надає варіанти автентифікації provider або метадані
налаштування/каталогу channel до завантаження runtime, онбординг може показати цей вибір,
запропонувати npm чи локальне встановлення, встановити або ввімкнути plugin, а потім продовжити вибраний
потік. Варіанти онбордингу npm потребують довірених метаданих каталогу з реєстровим
`npmSpec`; точні версії та `expectedIntegrity` — необов’язкові фіксації. Якщо
`expectedIntegrity` присутній, потоки встановлення/оновлення примусово перевіряють його. Зберігайте метадані «що
показувати» в `openclaw.plugin.json`, а метадані «як це встановити» —
у `package.json`.

Якщо задано `minHostVersion`, і встановлення, і завантаження реєстру маніфестів
примусово застосовують його. Старіші host пропускають plugin; некоректні рядки версій відхиляються.

Для зафіксованих npm-встановлень зберігайте точну версію в `npmSpec` і додавайте
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

`allowInvalidConfigRecovery` не є загальним обхідним шляхом для зламаних конфігурацій. Воно призначене
лише для вузького відновлення вбудованих plugin, щоб перевстановлення/налаштування могли виправити відомі
залишки після оновлення, як-от відсутній шлях до вбудованого plugin або застарілий запис `channels.<id>`
для цього самого plugin. Якщо конфігурація зламана з не пов’язаних причин, встановлення
усе одно завершується з відмовою та повідомляє оператору запустити `openclaw doctor --fix`.

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

Коли це ввімкнено, OpenClaw завантажує лише `setupEntry` під час фази запуску до початку прослуховування,
навіть для вже налаштованих channel. Повна точка входу завантажується після того, як Gateway починає прослуховування.

<Warning>
  Увімкнюйте відкладене завантаження лише тоді, коли ваш `setupEntry` реєструє все, що
  потрібно Gateway до початку прослуховування (реєстрація channel, HTTP-маршрути, методи
  Gateway). Якщо повна точка входу володіє потрібними можливостями запуску, зберігайте
  поведінку за замовчуванням.
</Warning>

Якщо ваша точка входу налаштування/повна точка входу реєструє методи Gateway RPC, зберігайте їх
на префіксі, специфічному для plugin. Зарезервовані простори імен базового адміністратора (`config.*`,
`exec.approvals.*`, `wizard.*`, `update.*`) залишаються у володінні core і завжди зіставляються
з `operator.admin`.

## Маніфест plugin

Кожен нативний plugin має постачатися з `openclaw.plugin.json` у корені пакета.
OpenClaw використовує його для перевірки конфігурації без виконання коду plugin.

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

Навіть plugins без конфігурації мають постачатися зі схемою. Порожня схема є допустимою:

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

Для пакетів plugin використовуйте команду ClawHub, специфічну для пакетів:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

Застарілий псевдонім публікації лише для Skills призначений для Skills. Пакети plugin
завжди мають використовувати `clawhub package publish`.

## Точка входу налаштування

Файл `setup-entry.ts` — це полегшена альтернатива `index.ts`, яку
OpenClaw завантажує, коли йому потрібні лише поверхні налаштування (онбординг, відновлення конфігурації,
перевірка вимкнених channel).

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

Це дає змогу уникнути завантаження важкого runtime-коду (криптобібліотек, реєстрацій CLI,
фонових сервісів) під час потоків налаштування.

Вбудовані workspace channel, які зберігають безпечні для налаштування експорти в sidecar-модулях, можуть
використовувати `defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract` замість
`defineSetupPluginEntry(...)`. Цей вбудований контракт також підтримує необов’язковий
експорт `runtime`, тож прив’язування runtime під час налаштування може залишатися легким і явним.

**Коли OpenClaw використовує `setupEntry` замість повної точки входу:**

- Channel вимкнений, але потребує поверхонь налаштування/онбордингу
- Channel увімкнений, але не налаштований
- Увімкнено відкладене завантаження (`deferConfiguredChannelFullLoadUntilAfterListen`)

**Що має реєструвати `setupEntry`:**

- Об’єкт channel plugin (через `defineSetupPluginEntry`)
- Будь-які HTTP-маршрути, потрібні до початку прослуховування Gateway
- Будь-які методи Gateway, потрібні під час запуску

Ці методи Gateway для запуску все одно мають уникати зарезервованих просторів імен
базового адміністратора, таких як `config.*` або `update.*`.

**Що НЕ має включати `setupEntry`:**

- Реєстрації CLI
- Фонові сервіси
- Важкі runtime-імпорти (crypto, SDK)
- Методи Gateway, потрібні лише після запуску

### Вузькі імпорти допоміжних засобів налаштування

Для гарячих шляхів лише налаштування надавайте перевагу вузьким швам допоміжних засобів налаштування замість ширшого
узагальненого `plugin-sdk/setup`, коли вам потрібна лише частина поверхні налаштування:

| Шлях імпорту                      | Для чого використовувати                                                                     | Ключові експорти                                                                                                                                                                                                                                                                               |
| --------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | допоміжні засоби runtime під час налаштування, які лишаються доступними в `setupEntry` / відкладеному запуску channel | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | адаптери налаштування облікових записів з урахуванням середовища                             | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                          |
| `plugin-sdk/setup-tools`           | допоміжні засоби налаштування/встановлення CLI/архівів/документації                          | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                 |

Використовуйте ширший шов `plugin-sdk/setup`, коли вам потрібен повний спільний
набір інструментів налаштування, включно з допоміжними засобами patch-конфігурації, такими як
`moveSingleAccountChannelSectionToDefaultAccount(...)`.

Адаптери patch для налаштування залишаються безпечними для гарячого шляху під час імпорту. Їхній вбудований
ледачий пошук поверхні контракту для просування single-account, тож імпорт
`plugin-sdk/setup-runtime` не завантажує передчасно виявлення поверхні вбудованого контракту до того, як адаптер справді буде використано.

### Просування single-account, що належить channel

Коли channel оновлюється з однокористувацької конфігурації верхнього рівня до
`channels.<id>.accounts.*`, типова спільна поведінка полягає в тому, щоб перемістити просунуті
значення з областю облікового запису в `accounts.default`.

Вбудовані channel можуть звузити або перевизначити це просування через свою поверхню контракту налаштування:

- `singleAccountKeysToMove`: додаткові ключі верхнього рівня, які слід перемістити в
  просунутий обліковий запис
- `namedAccountPromotionKeys`: коли іменовані облікові записи вже існують, лише ці
  ключі переміщуються в просунутий обліковий запис; спільні ключі policy/delivery залишаються в корені
  channel
- `resolveSingleAccountPromotionTarget(...)`: вибирає, який наявний обліковий запис
  отримає просунуті значення

Matrix — поточний вбудований приклад. Якщо вже існує рівно один іменований обліковий запис Matrix,
або якщо `defaultAccount` вказує на наявний неканонічний ключ, такий як `Ops`,
просування зберігає цей обліковий запис замість створення нового запису
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
Дивіться вбудовані пакети plugin (наприклад, plugin Discord `src/channel.setup.ts`) для
повних прикладів.

Для запитів щодо allowlist у DM, яким потрібен лише стандартний потік
`note -> prompt -> parse -> merge -> patch`, надавайте перевагу спільним допоміжним засобам налаштування
з `openclaw/plugin-sdk/setup`: `createPromptParsedAllowFromForAccount(...)`,
`createTopLevelChannelParsedAllowFromPrompt(...)` і
`createNestedChannelParsedAllowFromPrompt(...)`.

Для блоків статусу налаштування channel, які відрізняються лише ярликами, оцінками та необов’язковими
додатковими рядками, надавайте перевагу `createStandardChannelSetupStatus(...)` з
`openclaw/plugin-sdk/setup` замість ручного відтворення того самого об’єкта `status` у
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

`plugin-sdk/channel-setup` також надає нижчорівневі
будівники `createOptionalChannelSetupAdapter(...)` і
`createOptionalChannelSetupWizard(...)`, коли вам потрібна лише одна половина
цієї необов’язкової поверхні встановлення.

Згенеровані необов’язкові адаптер/майстер завершуються з відмовою на реальних записах конфігурації. Вони
повторно використовують одне повідомлення про необхідність встановлення в `validateInput`,
`applyAccountConfig` і `finalize`, а також додають посилання на документацію, якщо встановлено `docsPath`.

Для UI налаштування, що працюють через binary, надавайте перевагу спільним делегованим допоміжним засобам замість
копіювання однакової логіки binary/status у кожний channel:

- `createDetectedBinaryStatus(...)` для блоків статусу, що відрізняються лише ярликами,
  підказками, оцінками та виявленням binary
- `createCliPathTextInput(...)` для текстових полів на основі шляху
- `createDelegatedSetupWizardStatusResolvers(...)`,
  `createDelegatedPrepare(...)`, `createDelegatedFinalize(...)` і
  `createDelegatedResolveConfigured(...)`, коли `setupEntry` має ліниво пересилати до
  важчого повного майстра
- `createDelegatedTextInputShouldPrompt(...)`, коли `setupEntry` має лише
  делегувати рішення `textInputs[*].shouldPrompt`

## Публікація та встановлення

**Зовнішні plugins:** опублікуйте в [ClawHub](/uk/tools/clawhub) або npm, а потім встановіть:

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw спочатку пробує ClawHub і автоматично переходить на npm у разі невдачі. Ви також можете
явно примусово використовувати ClawHub:

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # Лише ClawHub
```

Відповідного перевизначення `npm:` не існує. Використовуйте звичайну специфікацію npm-пакета, коли
вам потрібен шлях npm після переходу з ClawHub:

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
  Для встановлень із джерела npm `openclaw plugins install` запускає
  `npm install --ignore-scripts` (без lifecycle scripts). Зберігайте дерево залежностей plugin
  чистим JS/TS і уникайте пакетів, які потребують збірок `postinstall`.
</Info>

Вбудовані plugins, що належать OpenClaw, — єдиний виняток для відновлення під час запуску: коли
пакетне встановлення бачить один із них увімкненим через конфігурацію plugin, застарілу конфігурацію channel або
його вбудований маніфест із увімкненням за замовчуванням, під час запуску встановлюються відсутні
runtime-залежності цього plugin до імпорту. Сторонні plugins не повинні покладатися на
встановлення під час запуску; продовжуйте використовувати явний інсталятор plugin.

## Пов’язані матеріали

- [SDK Entry Points](/uk/plugins/sdk-entrypoints) -- `definePluginEntry` і `defineChannelPluginEntry`
- [Plugin Manifest](/uk/plugins/manifest) -- повний довідник зі схемою маніфесту
- [Building Plugins](/uk/plugins/building-plugins) -- покроковий посібник для початку роботи
