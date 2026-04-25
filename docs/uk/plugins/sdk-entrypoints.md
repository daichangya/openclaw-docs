---
read_when:
    - Вам потрібен точний сигнатурний тип `definePluginEntry` або `defineChannelPluginEntry`
    - Ви хочете зрозуміти режим реєстрації (повний vs налаштування vs метадані CLI)
    - Ви шукаєте параметри точки входу
sidebarTitle: Entry Points
summary: Довідка для `definePluginEntry`, `defineChannelPluginEntry` і `defineSetupPluginEntry`
title: Точки входу Plugin
x-i18n:
    generated_at: "2026-04-25T02:40:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8253cf0ac43ca11b42c0032027bba6e926c961b54901caaa63da70bd5ff5aab5
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

Кожен Plugin експортує типовий об’єкт точки входу. SDK надає три хелпери для
їх створення.

Для встановлених Plugin `package.json` має спрямовувати завантаження під час виконання на зібраний
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

`extensions` і `setupEntry` залишаються валідними точками входу вихідного коду для розробки у workspace та git checkout.
`runtimeExtensions` і `runtimeSetupEntry` мають пріоритет, коли OpenClaw завантажує встановлений пакет, і дають змогу npm-пакетам уникати компіляції TypeScript під час виконання. Якщо встановлений пакет оголошує лише точку входу вихідного коду TypeScript, OpenClaw використає відповідний зібраний peer `dist/*.js`, якщо він існує, а потім повернеться до вихідного коду TypeScript.

Усі шляхи точок входу мають залишатися в межах каталогу пакета Plugin. Точки входу під час виконання
та виведені з них peer-файли зібраного JavaScript не роблять валідним шлях `extensions` або
`setupEntry`, що виходить за межі пакета.

<Tip>
  **Шукаєте покрокове пояснення?** Див. [Channel Plugins](/uk/plugins/sdk-channel-plugins)
  або [Provider Plugins](/uk/plugins/sdk-provider-plugins) для покрокових інструкцій.
</Tip>

## `definePluginEntry`

**Імпорт:** `openclaw/plugin-sdk/plugin-entry`

Для Plugin провайдерів, Plugin інструментів, Plugin хуків і всього, що **не є**
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

| Поле           | Тип                                                              | Обов’язково | Типове значення     |
| -------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`           | `string`                                                         | Так         | —                   |
| `name`         | `string`                                                         | Так         | —                   |
| `description`  | `string`                                                         | Так         | —                   |
| `kind`         | `string`                                                         | Ні          | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Порожня схема об’єкта |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Так         | —                   |

- `id` має збігатися з вашим маніфестом `openclaw.plugin.json`.
- `kind` призначене для ексклюзивних слотів: `"memory"` або `"context-engine"`.
- `configSchema` може бути функцією для лінивого обчислення.
- OpenClaw обчислює та мемоїзує цю схему під час першого доступу, тому дорогі побудовники схем
  запускаються лише один раз.

## `defineChannelPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Обгортає `definePluginEntry` логікою, специфічною для каналу. Автоматично викликає
`api.registerChannel({ plugin })`, відкриває необов’язковий seam метаданих CLI для кореневої довідки
і обмежує `registerFull` режимом реєстрації.

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

| Поле                  | Тип                                                              | Обов’язково | Типове значення     |
| --------------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`                  | `string`                                                         | Так         | —                   |
| `name`                | `string`                                                         | Так         | —                   |
| `description`         | `string`                                                         | Так         | —                   |
| `plugin`              | `ChannelPlugin`                                                  | Так         | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Порожня схема об’єкта |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | Ні          | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | Ні          | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | Ні          | —                   |

- `setRuntime` викликається під час реєстрації, щоб ви могли зберегти посилання на runtime
  (зазвичай через `createPluginRuntimeStore`). Він пропускається під час захоплення метаданих CLI.
- `registerCliMetadata` виконується під час `api.registrationMode === "cli-metadata"`,
  `api.registrationMode === "discovery"` і
  `api.registrationMode === "full"`.
  Використовуйте його як канонічне місце для CLI-дескрипторів, що належать каналу, щоб коренева довідка
  залишалася без активації, знімки discovery включали статичні метадані команд, а
  звичайна реєстрація команд CLI залишалася сумісною з повними завантаженнями Plugin.
- Реєстрація в режимі discovery не активує, але й не є вільною від імпорту. OpenClaw може
  обчислювати довірену точку входу Plugin і модуль channel Plugin, щоб побудувати
  знімок, тому зберігайте імпорти верхнього рівня без побічних ефектів, а сокети,
  клієнти, воркери та сервіси розміщуйте за шляхами лише для `"full"`.
- `registerFull` виконується лише коли `api.registrationMode === "full"`. Він пропускається
  під час завантаження лише для setup.
- Як і у `definePluginEntry`, `configSchema` може бути лінивою фабрикою, а OpenClaw
  мемоїзує обчислену схему під час першого доступу.
- Для кореневих CLI-команд, що належать Plugin, віддавайте перевагу `api.registerCli(..., { descriptors: [...] })`,
  якщо хочете, щоб команда залишалася ліниво завантажуваною, не зникаючи з
  дерева розбору кореневого CLI. Для channel Plugin віддавайте перевагу реєстрації таких дескрипторів
  із `registerCliMetadata(...)`, а `registerFull(...)` залишайте зосередженим на роботі лише під час виконання.
- Якщо `registerFull(...)` також реєструє методи Gateway RPC, залишайте їх
  на префіксі, специфічному для Plugin. Зарезервовані простори імен адміністрування ядра (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) завжди примусово приводяться до
  `operator.admin`.

## `defineSetupPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Для легковагового файла `setup-entry.ts`. Повертає лише `{ plugin }` без
runtime чи CLI-логіки.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw завантажує це замість повної точки входу, коли канал вимкнений,
не налаштований або коли ввімкнене відкладене завантаження. Див.
[Setup and Config](/uk/plugins/sdk-setup#setup-entry), щоб зрозуміти, коли це має значення.

На практиці поєднуйте `defineSetupPluginEntry(...)` із вузькими сімействами setup-хелперів:

- `openclaw/plugin-sdk/setup-runtime` для безпечних для runtime setup-хелперів, таких як
  адаптери setup-патчів, безпечні для імпорту, вивід lookup-note,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані setup-проксі
- `openclaw/plugin-sdk/channel-setup` для поверхонь setup з необов’язковим встановленням
- `openclaw/plugin-sdk/setup-tools` для CLI/archive/docs-хелперів setup/install

Тримайте важкі SDK, реєстрацію CLI та довгоживучі runtime-сервіси в повній
точці входу.

Вбудовані workspace-канали, які розділяють setup- і runtime-поверхні, можуть натомість використовувати
`defineBundledChannelSetupEntry(...)` з
`openclaw/plugin-sdk/channel-entry-contract`. Цей контракт дає змогу
точці входу setup зберігати безпечні для setup експорти plugin/secrets, водночас відкриваючи
setter runtime:

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

Використовуйте цей вбудований контракт лише тоді, коли setup-потокам справді потрібен легковаговий
setter runtime до завантаження повної точки входу каналу.

## Режим реєстрації

`api.registrationMode` повідомляє вашому Plugin, як саме його було завантажено:

| Режим             | Коли                             | Що реєструвати                                                                                                           |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `"full"`          | Звичайний запуск Gateway         | Усе                                                                                                                      |
| `"discovery"`     | Discovery можливостей лише для читання | Реєстрація каналу плюс статичні CLI-дескриптори; код точки входу може завантажуватися, але пропускайте сокети, воркери, клієнти та сервіси |
| `"setup-only"`    | Вимкнений/неналаштований канал   | Лише реєстрація каналу                                                                                                   |
| `"setup-runtime"` | Потік setup з доступним runtime  | Реєстрація каналу плюс лише легковаговий runtime, потрібний до завантаження повної точки входу                          |
| `"cli-metadata"`  | Коренева довідка / захоплення метаданих CLI | Лише CLI-дескриптори                                                                                             |

`defineChannelPluginEntry` обробляє цей поділ автоматично. Якщо ви використовуєте
`definePluginEntry` безпосередньо для каналу, самі перевіряйте режим:

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // Heavy runtime-only registrations
  api.registerService(/* ... */);
}
```

Режим discovery будує знімок реєстру без активації. Він усе ж може обчислювати
точку входу Plugin і об’єкт channel Plugin, щоб OpenClaw міг зареєструвати можливості каналу
та статичні CLI-дескриптори. Ставтеся до обчислення модуля в discovery як до
довіреного, але легковагового: без мережевих клієнтів, підпроцесів, слухачів, з’єднань із базою даних,
фонових воркерів, читання облікових даних чи інших побічних ефектів живого runtime на верхньому рівні.

Сприймайте `"setup-runtime"` як вікно, у якому поверхні запуску лише для setup мають
існувати без повторного входу в повний bundled runtime каналу. Добре підходять
реєстрація каналу, безпечні для setup HTTP-маршрути, безпечні для setup методи Gateway
і делеговані setup-хелпери. Важкі фонові сервіси, реєстратори CLI
та завантаження SDK провайдерів/клієнтів усе ще належать до `"full"`.

Зокрема для реєстраторів CLI:

- використовуйте `descriptors`, коли реєстратор володіє однією чи кількома кореневими командами і ви
  хочете, щоб OpenClaw ліниво завантажував справжній модуль CLI під час першого виклику
- переконайтеся, що ці дескриптори охоплюють кожен корінь команди верхнього рівня, який відкриває
  реєстратор
- імена команд дескрипторів мають містити лише літери, цифри, дефіс і підкреслення,
  починаючись із літери або цифри; OpenClaw відхиляє імена дескрипторів поза
  цією формою та прибирає керувальні послідовності термінала з описів перед
  показом довідки
- використовуйте лише `commands` тільки для eager-шляхів сумісності

## Форми Plugin

OpenClaw класифікує завантажені Plugin за їхньою поведінкою реєстрації:

| Форма                 | Опис                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | Один тип можливостей (наприклад, лише провайдер)   |
| **hybrid-capability** | Кілька типів можливостей (наприклад, провайдер + мовлення) |
| **hook-only**         | Лише хуки, без можливостей                         |
| **non-capability**    | Інструменти/команди/сервіси, але без можливостей   |

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму Plugin.

## Пов’язане

- [SDK Overview](/uk/plugins/sdk-overview) — API реєстрації та довідка щодо subpath
- [Runtime Helpers](/uk/plugins/sdk-runtime) — `api.runtime` і `createPluginRuntimeStore`
- [Setup and Config](/uk/plugins/sdk-setup) — маніфест, точка входу setup, відкладене завантаження
- [Channel Plugins](/uk/plugins/sdk-channel-plugins) — побудова об’єкта `ChannelPlugin`
- [Provider Plugins](/uk/plugins/sdk-provider-plugins) — реєстрація провайдера та хуки
