---
read_when:
    - Вам потрібен точний сигнатурний тип definePluginEntry або defineChannelPluginEntry
    - Ви хочете зрозуміти режим реєстрації (full vs setup vs метадані CLI)
    - Ви шукаєте параметри точки входу
sidebarTitle: Entry Points
summary: Довідник для definePluginEntry, defineChannelPluginEntry і defineSetupPluginEntry
title: Точки входу плагінів
x-i18n:
    generated_at: "2026-04-05T18:12:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 799dbfe71e681dd8ba929a7a631dfe745c3c5c69530126fea2f9c137b120f51f
    source_path: plugins/sdk-entrypoints.md
    workflow: 15
---

# Точки входу плагінів

Кожен плагін експортує типовий об’єкт точки входу. SDK надає три допоміжні функції для
їх створення.

<Tip>
  **Шукаєте покрокове пояснення?** Див. [Channel Plugins](/plugins/sdk-channel-plugins)
  або [Provider Plugins](/plugins/sdk-provider-plugins) для покрокових посібників.
</Tip>

## `definePluginEntry`

**Імпорт:** `openclaw/plugin-sdk/plugin-entry`

Для плагінів провайдерів, плагінів інструментів, плагінів хуків і всього, що **не** є
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

| Поле           | Тип                                                              | Обов’язкове | Типове значення     |
| -------------- | ---------------------------------------------------------------- | ----------- | ------------------- |
| `id`           | `string`                                                         | Так         | —                   |
| `name`         | `string`                                                         | Так         | —                   |
| `description`  | `string`                                                         | Так         | —                   |
| `kind`         | `string`                                                         | Ні          | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | Ні          | Порожня схема об’єкта |
| `register`     | `(api: OpenClawPluginApi) => void`                               | Так         | —                   |

- `id` має збігатися з вашим маніфестом `openclaw.plugin.json`.
- `kind` призначено для ексклюзивних слотів: `"memory"` або `"context-engine"`.
- `configSchema` може бути функцією для ледачого обчислення.
- OpenClaw визначає та мемоїзує цю схему при першому доступі, тому витратні побудовники схем
  виконуються лише один раз.

## `defineChannelPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Обгортає `definePluginEntry` логікою, специфічною для каналів. Автоматично викликає
`api.registerChannel({ plugin })`, надає необов’язковий шов метаданих CLI для кореневої довідки
та обмежує `registerFull` режимом реєстрації.

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

| Поле                  | Тип                                                              | Обов’язкове | Типове значення     |
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
  (зазвичай через `createPluginRuntimeStore`). Під час захоплення метаданих CLI вона пропускається.
- `registerCliMetadata` виконується і під час `api.registrationMode === "cli-metadata"`,
  і під час `api.registrationMode === "full"`.
  Використовуйте це як канонічне місце для дескрипторів CLI, що належать каналу, щоб коренева довідка
  залишалася без активації, а звичайна реєстрація команд CLI зберігала сумісність
  із повними завантаженнями плагінів.
- `registerFull` виконується лише тоді, коли `api.registrationMode === "full"`. Воно пропускається
  під час завантаження лише для setup.
- Як і у `definePluginEntry`, `configSchema` може бути лінивою фабрикою, а OpenClaw
  мемоїзує визначену схему при першому доступі.
- Для кореневих CLI-команд, що належать плагіну, надавайте перевагу `api.registerCli(..., { descriptors: [...] })`,
  якщо хочете, щоб команда залишалася ліниво завантажуваною, але не зникала з
  дерева розбору кореневого CLI. Для каналових плагінів надавайте перевагу реєстрації цих дескрипторів
  із `registerCliMetadata(...)`, а `registerFull(...)` зосередьте на роботі, потрібній лише під час runtime.
- Якщо `registerFull(...)` також реєструє gateway RPC-методи, тримайте їх на
  префіксі, специфічному для плагіна. Зарезервовані простори назв адміністрування ядра (`config.*`,
  `exec.approvals.*`, `wizard.*`, `update.*`) завжди примусово переводяться в
  `operator.admin`.

## `defineSetupPluginEntry`

**Імпорт:** `openclaw/plugin-sdk/channel-core`

Для полегшеного файла `setup-entry.ts`. Повертає лише `{ plugin }` без
логіки runtime або CLI.

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

OpenClaw завантажує це замість повної точки входу, коли канал вимкнено,
не налаштовано або коли ввімкнено відкладене завантаження. Див.
[Setup and Config](/plugins/sdk-setup#setup-entry), щоб зрозуміти, коли це важливо.

На практиці поєднуйте `defineSetupPluginEntry(...)` із вузькими сімействами допоміжних функцій setup:

- `openclaw/plugin-sdk/setup-runtime` для безпечних для runtime допоміжних функцій setup, як-от
  безпечні для імпорту адаптери патчів setup, вивід приміток lookup,
  `promptResolvedAllowFrom`, `splitSetupEntries` і делеговані проксі setup
- `openclaw/plugin-sdk/channel-setup` для поверхонь setup необов’язкового встановлення
- `openclaw/plugin-sdk/setup-tools` для допоміжних функцій CLI/архівів/документації для setup/install

Тримайте важкі SDK, реєстрацію CLI та довготривалі сервіси runtime у повній
точці входу.

## Режим реєстрації

`api.registrationMode` повідомляє вашому плагіну, як саме його було завантажено:

| Режим             | Коли                              | Що реєструвати                                                                          |
| ----------------- | --------------------------------- | --------------------------------------------------------------------------------------- |
| `"full"`          | Звичайний запуск gateway          | Усе                                                                                     |
| `"setup-only"`    | Вимкнений/не налаштований канал   | Лише реєстрацію каналу                                                                  |
| `"setup-runtime"` | Потік setup із доступним runtime  | Реєстрацію каналу плюс лише легкий runtime, потрібний до завантаження повної точки входу |
| `"cli-metadata"`  | Коренева довідка / захоплення метаданих CLI | Лише дескриптори CLI                                                                    |

`defineChannelPluginEntry` обробляє цей поділ автоматично. Якщо ви використовуєте
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

Розглядайте `"setup-runtime"` як проміжок, у якому поверхні запуску лише для setup мають
існувати без повторного входу в повний bundled runtime каналу. Добре підходять
реєстрація каналу, безпечні для setup HTTP-маршрути, безпечні для setup gateway-методи та
делеговані допоміжні функції setup. Важкі фонові сервіси, реєстратори CLI та
завантаження SDK провайдерів/клієнтів, як і раніше, належать до `"full"`.

Зокрема для реєстраторів CLI:

- використовуйте `descriptors`, коли реєстратор володіє однією або кількома кореневими командами і ви
  хочете, щоб OpenClaw ліниво завантажував справжній модуль CLI при першому виклику
- переконайтеся, що ці дескриптори охоплюють кожен корінь команди верхнього рівня, який відкриває
  реєстратор
- використовуйте лише `commands` для жадібних шляхів сумісності

## Форми плагінів

OpenClaw класифікує завантажені плагіни за їхньою поведінкою реєстрації:

| Форма                | Опис                                               |
| -------------------- | -------------------------------------------------- |
| **plain-capability**  | Один тип можливостей (наприклад, лише провайдер)   |
| **hybrid-capability** | Кілька типів можливостей (наприклад, провайдер + speech) |
| **hook-only**         | Лише hooks, без можливостей                        |
| **non-capability**    | Інструменти/команди/сервіси, але без можливостей   |

Використовуйте `openclaw plugins inspect <id>`, щоб побачити форму плагіна.

## Пов’язане

- [Огляд SDK](/plugins/sdk-overview) — API реєстрації та довідник за subpath
- [Допоміжні функції runtime](/plugins/sdk-runtime) — `api.runtime` і `createPluginRuntimeStore`
- [Setup and Config](/plugins/sdk-setup) — маніфест, setup entry, відкладене завантаження
- [Channel Plugins](/plugins/sdk-channel-plugins) — створення об’єкта `ChannelPlugin`
- [Provider Plugins](/plugins/sdk-provider-plugins) — реєстрація провайдерів і hooks
