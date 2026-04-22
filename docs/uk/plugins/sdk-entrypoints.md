---
read_when:
    - Вам потрібен точний сигнатурний тип для definePluginEntry або defineChannelPluginEntry
    - Ви хочете зрозуміти режим реєстрації (повний, setup чи метадані CLI)
    - Ви шукаєте параметри точки входу
sidebarTitle: Entry Points
summary: Довідка щодо definePluginEntry, defineChannelPluginEntry та defineSetupPluginEntry
title: Точки входу Plugin
x-i18n:
    generated_at: "2026-04-22T00:13:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: b794e1a880e4a32318236fab515f5fd395a0c8c2d1a0e6a4ea388eef447975a7
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Точки входу Plugin

Кожен plugin експортує типовий об’єкт точки входу. SDK надає три допоміжні функції для
їх створення.

Для встановлених plugin `package.json` має вказувати завантаженню під час виконання на зібраний
JavaScript, коли він доступний:

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` і `setupEntry` залишаються чинними вихідними точками входу для розробки у workspace та з git checkout.
`runtimeExtensions` і `runtimeSetupEntry` мають пріоритет, коли OpenClaw завантажує встановлений пакет, і дають змогу npm-пакетам уникати компіляції TypeScript під час виконання. Якщо встановлений пакет оголошує лише вихідну точку входу TypeScript, OpenClaw використає відповідний зібраний peer `dist/*.js`, якщо він існує, а потім повернеться до вихідного TypeScript-коду.

Усі шляхи точок входу мають залишатися в межах каталогу пакета plugin. Точки входу під час виконання
та виведені з них зібрані peer JavaScript не роблять коректним вихідний шлях `extensions` або
`setupEntry`, що виходить за ці межі.

<Tip>
  **Шукаєте покрокову інструкцію?** Дивіться [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  або [Provider Plugins](/uk/plugins/sdk-provider-plugins) для покрокових посібників.
</Tip>

## `definePluginEntry`

**Імпорт:** `openclaw/plugin-sdk/plugin-entry`

Для plugin провайдерів, plugin інструментів, plugin хуків та всього, що **не** є
каналом обміну повідомленнями.

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| Поле           | Тип                                                              | Обов’язкове | Типово              |
| -------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`           | `string`                                                         | Так         | —                   |
| `name`         | `string`                                                         | Так         | —                   |
| `description`  | `string`                                                         | Так         | —                   |
| `kind`         | `string`                                                         | Ні          | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Порожня схема об’єкта |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Так         | —                   |

- `id` має збігатися з вашим маніфестом `openclaw.plugin.json`.
- `kind` призначене для ексклюзивних слотів: `"memory"` або `"context-engine"`.
- `configSchema` може бути функцією для лінивої обробки.
- OpenClaw визначає та мемоїзує цю схему при першому зверненні, тож витратні
  побудовники схем виконуються лише один раз.

## `defineChannelPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Обгортає `definePluginEntry` логікою, специфічною для каналів. Автоматично викликає
`api.registerChannel({ plugin })`, надає необов’язковий шов метаданих CLI для кореневої довідки
та керує `registerFull` залежно від режиму реєстрації.

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| Поле                  | Тип                                                              | Обов’язкове | Типово              |
| --------------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`                  | `string`                                                         | Так         | —                   |
| `name`                | `string`                                                         | Так         | —                   |
| `description`         | `string`                                                         | Так         | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Так         | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Порожня схема об’єкта |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Ні          | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Ні          | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Ні          | —                   |

- `setRuntime` викликається під час реєстрації, тож ви можете зберегти посилання на runtime
  (зазвичай через `createPluginRuntimeStore`). Вона пропускається під час збирання
  метаданих CLI.
- `registerCliMetadata` виконується як під час `api.registrationMode === "cli-metadata"`,
  так і під час `api.registrationMode === "full"`.
  Використовуйте її як канонічне місце для дескрипторів CLI, що належать каналу, щоб
  коренева довідка не активувала plugin, а звичайна реєстрація команд CLI залишалася
  сумісною з повним завантаженням plugin.
- `registerFull` виконується лише коли `api.registrationMode === "full"`. Вона пропускається
  під час завантаження лише для setup.
- Як і у `definePluginEntry`, `configSchema` може бути лінивою фабрикою, а OpenClaw
  мемоїзує визначену схему при першому зверненні.
- Для кореневих команд CLI, що належать plugin, надавайте перевагу `api.registerCli(..., { descriptors: [...] })`,
  якщо хочете, щоб команда залишалася ліниво завантажуваною, але не зникала з
  дерева розбору кореневого CLI. Для channel plugin надавайте перевагу реєстрації
  цих дескрипторів із `registerCliMetadata(...)`, а `registerFull(...)` залишайте
  зосередженим на роботі лише під час виконання.
- Якщо `registerFull(...)` також реєструє RPC-методи Gateway, зберігайте для них
  префікс, специфічний для plugin. Зарезервовані простори назв адміністрування ядра (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) завжди примусово переводяться до
  `operator.admin`.

## `defineSetupPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Для полегшеного файла `setup-entry.ts`. Повертає лише `{ plugin }` без
логіки runtime чи CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw завантажує це замість повної точки входу, коли канал вимкнений,
не налаштований або коли ввімкнено відкладене завантаження. Див.
[Setup and Config](/uk/plugins/sdk-setup#setup-entry), щоб зрозуміти, коли це має значення.

На практиці поєднуйте `defineSetupPluginEntry(...)` із вузькими сімействами
допоміжних функцій setup:

- `openclaw/plugin-sdk/setup-runtime` для безпечних для runtime допоміжних функцій setup, таких як
  безпечні для імпорту адаптери patch setup, виведення приміток пошуку,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані проксі setup
- `openclaw/plugin-sdk/channel-setup` для поверхонь setup з необов’язковим встановленням
- `openclaw/plugin-sdk/setup-tools` для допоміжних засобів setup/install CLI/archive/docs

Залишайте важкі SDK, реєстрацію CLI та довготривалі сервіси runtime у повній
точці входу.

Вбудовані workspace-канали, які розділяють поверхні setup і runtime, можуть
використовувати `defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract` замість цього. Цей контракт дає змогу
точці входу setup зберігати безпечні для setup експорти plugin/secrets, водночас
усе ще надаючи сетер runtime:

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

Використовуйте цей вбудований контракт лише тоді, коли потокам setup справді потрібен
полегшений сетер runtime до завантаження повної точки входу каналу.

## Режим реєстрації

`api.registrationMode` повідомляє вашому plugin, як саме його було завантажено:

| Режим             | Коли                              | Що реєструвати                                                                           |
| ----------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| `"full"`          | Звичайний запуск Gateway          | Усе                                                                                      |
| `"setup-only"`    | Вимкнений/не налаштований канал   | Лише реєстрацію каналу                                                                   |
| `"setup-runtime"` | Потік setup з доступним runtime   | Реєстрацію каналу плюс лише полегшений runtime, потрібний до завантаження повної точки входу |
| `"cli-metadata"`  | Коренева довідка / збирання метаданих CLI | Лише дескриптори CLI                                                                     |

`defineChannelPluginEntry` обробляє це розділення автоматично. Якщо ви використовуєте
`definePluginEntry` безпосередньо для каналу, перевіряйте режим самостійно:

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Сприймайте `"setup-runtime"` як проміжок, у якому поверхні запуску лише для setup мають
існувати без повторного входу до повного вбудованого runtime каналу. Доречні варіанти —
реєстрація каналу, безпечні для setup HTTP-маршрути, безпечні для setup методи Gateway і
делеговані допоміжні функції setup. Важкі фонові сервіси, реєстратори CLI та
запуск SDK провайдерів/клієнтів, як і раніше, належать до `"full"`.

Зокрема для реєстраторів CLI:

- використовуйте `descriptors`, коли реєстратор володіє однією або кількома кореневими командами і ви
  хочете, щоб OpenClaw ліниво завантажував справжній модуль CLI при першому виклику
- переконайтеся, що ці дескриптори охоплюють кожен корінь команди верхнього рівня, який надає
  реєстратор
- використовуйте лише `commands` тільки для шляхів сумісності з eager-завантаженням

## Форми plugin

OpenClaw класифікує завантажені plugin за їхньою поведінкою під час реєстрації:

| Форма                | Опис                                              |
| -------------------- | ------------------------------------------------- |
| **plain-capability**  | Один тип можливостей (наприклад, лише провайдер) |
| **hybrid-capability** | Кілька типів можливостей (наприклад, провайдер + мовлення) |
| **hook-only**         | Лише хуки, без можливостей                        |
| **non-capability**    | Інструменти/команди/сервіси, але без можливостей |

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму plugin.

## Пов’язане

- [SDK Overview](/uk/plugins/sdk-overview) — API реєстрації та довідник підшляхів
- [Runtime Helpers](/uk/plugins/sdk-runtime) — `api.runtime` і `createPluginRuntimeStore`
- [Setup and Config](/uk/plugins/sdk-setup) — маніфест, точка входу setup, відкладене завантаження
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — побудова об’єкта `ChannelPlugin`
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — реєстрація провайдерів і хуків
