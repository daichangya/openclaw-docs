---
read_when:
    - Перше налаштування OpenClaw
    - Пошук поширених шаблонів конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-23T08:14:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: a674bbc73f3a501ffd47ef9396d55d6087806921cfb24ef576398022dd0248c3
    source_path: gateway/configuration.md
    workflow: 15
---

# Конфігурація

OpenClaw читає необов’язковий конфігураційний файл <Tooltip tip="JSON5 підтримує коментарі та кінцеві коми">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має вказувати на звичайний файл. Схеми
`openclaw.json` із символьними посиланнями не підтримуються для записів,
якими керує OpenClaw; атомарний запис може замінити шлях замість збереження
символьного посилання. Якщо ви зберігаєте конфігурацію поза типовим
каталогом стану, вкажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Типові причини додати конфігурацію:

- Підключити канали та керувати тим, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (Cron, хуки)
- Налаштувати сесії, медіа, мережу або UI

Перегляньте [повний довідник](/uk/gateway/configuration-reference), щоб побачити всі доступні поля.

<Tip>
**Вперше працюєте з конфігурацією?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) для готових конфігурацій, які можна повністю скопіювати й вставити.
</Tip>

## Мінімальна конфігурація

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Редагування конфігурації

<Tabs>
  <Tab title="Інтерактивний майстер">
    ```bash
    openclaw onboard       # повний процес початкового налаштування
    openclaw configure     # майстер конфігурації
    ```
  </Tab>
  <Tab title="CLI (однорядкові команди)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і використайте вкладку **Config**.
    Control UI відображає форму з живої схеми конфігурації, включно з метаданими документації полів
    `title` / `description`, а також схемами plugin і каналів, коли вони
    доступні, з редактором **Raw JSON** як запасним варіантом. Для інтерфейсів
    деталізації та інших інструментів gateway також надає `config.schema.lookup`,
    щоб отримати один вузол схеми для певного шляху разом із короткими
    відомостями про безпосередні дочірні елементи.
  </Tab>
  <Tab title="Пряме редагування">
    Відредагуйте `~/.openclaw/openclaw.json` напряму. Gateway відстежує файл і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, що повністю відповідають схемі. Невідомі ключі, некоректні типи або недійсні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли підключати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують Control UI
та валідація. `config.schema.lookup` отримує один вузол для певного шляху разом
із короткими відомостями про дочірні елементи для інструментів деталізації.
Метадані документації полів `title`/`description` поширюються на вкладені об’єкти,
підстановочні символи (`*`), елементи масиву (`[]`) та гілки `anyOf`/
`oneOf`/`allOf`. Схеми runtime plugin і каналів додаються під час завантаження
реєстру маніфестів.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Після кожного успішного запуску Gateway зберігає довірену останню коректну копію.
Якщо пізніше `openclaw.json` не проходить валідацію (або втрачає `gateway.mode`,
різко зменшується, або на початку з’являється сторонній рядок журналу),
OpenClaw зберігає пошкоджений файл як `.clobbered.*`, відновлює останню коректну
копію та записує причину відновлення в журнал. Під час наступного ходу агента
також надходить попередження про системну подію, щоб основний агент не
перезаписав відновлену конфігурацію без перевірки. Підвищення до статусу
останньої коректної копії пропускається, якщо кандидат містить замасковані
заповнювачі секретів, такі як `***`.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Налаштування каналу (WhatsApp, Telegram, Discord тощо)">
    Кожен канал має власний розділ конфігурації в `channels.<provider>`. Кроки налаштування дивіться на окремій сторінці каналу:

    - [WhatsApp](/uk/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/uk/channels/telegram) — `channels.telegram`
    - [Discord](/uk/channels/discord) — `channels.discord`
    - [Feishu](/uk/channels/feishu) — `channels.feishu`
    - [Google Chat](/uk/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/uk/channels/msteams) — `channels.msteams`
    - [Slack](/uk/channels/slack) — `channels.slack`
    - [Signal](/uk/channels/signal) — `channels.signal`
    - [iMessage](/uk/channels/imessage) — `channels.imessage`
    - [Mattermost](/uk/channels/mattermost) — `channels.mattermost`

    Усі канали використовують однаковий шаблон політики DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Вибір і налаштування моделей">
    Задайте основну модель і необов’язкові резервні варіанти:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` визначає каталог моделей і виконує роль списку дозволених значень для `/model`.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи до списку дозволених без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо ви не передасте `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням розміру зображень у транскрипті/інструментах (типове значення `1200`); менші значення зазвичай зменшують використання vision-токенів у запусках із великою кількістю знімків екрана.
    - Див. [Models CLI](/uk/concepts/models), щоб перемикати моделі в чаті, і [Model Failover](/uk/concepts/model-failover) щодо ротації авторизації та поведінки резервних моделей.
    - Для користувацьких/самостійно розміщених провайдерів див. [Custom providers](/uk/gateway/configuration-reference#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керування тим, хто може надсилати повідомлення боту">
    Доступ до DM керується окремо для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код сполучення для підтвердження
    - `"allowlist"`: лише відправники з `allowFrom` (або зі сховища парного списку дозволених)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або списки дозволених, специфічні для каналу.

    Див. [повний довідник](/uk/gateway/configuration-reference#dm-and-group-access) для подробиць щодо кожного каналу.

  </Accordion>

  <Accordion title="Налаштування фільтрації згадок у групових чатах">
    За замовчуванням для групових повідомлень **потрібна згадка**. Налаштуйте шаблони для кожного агента:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Згадки в метаданих**: нативні @-згадки (WhatsApp tap-to-mention, Telegram @bot тощо)
    - **Текстові шаблони**: безпечні шаблони regex у `mentionPatterns`
    - Див. [повний довідник](/uk/gateway/configuration-reference#group-chat-mention-gating) для перевизначень на рівні каналів і режиму self-chat.

  </Accordion>

  <Accordion title="Обмеження Skills для агента">
    Використовуйте `agents.defaults.skills` для спільної базової конфігурації, а потім перевизначайте конкретних
    агентів через `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Не вказуйте `agents.defaults.skills`, якщо за замовчуванням Skills не мають бути обмежені.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати типові значення.
    - Установіть `agents.list[].skills: []`, щоб не дозволяти жодних Skills.
    - Див. [Skills](/uk/tools/skills), [Skills config](/uk/tools/skills-config) і
      [Configuration Reference](/uk/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Налаштування моніторингу стану каналів gateway">
    Керуйте тим, наскільки агресивно gateway перезапускає канали, що виглядають застарілими:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Установіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски через моніторинг стану.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуск для одного каналу чи облікового запису без вимкнення глобального моніторингу.
    - Див. [Health Checks](/uk/gateway/health) для операційної діагностики та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштування сесій і скидання">
    Сесії керують безперервністю та ізоляцією розмов:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (спільна) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: глобальні типові значення для маршрутизації сесій, прив’язаних до потоків (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Session Management](/uk/concepts/session) щодо області видимості, зв’язків ідентичностей і політики надсилання.
    - Див. [повний довідник](/uk/gateway/configuration-reference#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнення ізоляції">
    Запускайте сесії агентів в ізольованих sandbox runtime:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Спочатку зберіть образ: `scripts/sandbox-setup.sh`

    Див. [Sandboxing](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/configuration-reference#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнення relay-backed push для офіційних збірок iOS">
    Relay-backed push налаштовується в `openclaw.json`.

    Додайте це в конфігурацію gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Еквівалент у CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Що це робить:

    - Дає змогу gateway надсилати `push.test`, сигнали пробудження та сигнали повторного підключення через зовнішній relay.
    - Використовує дозвіл на надсилання в межах реєстрації, який пересилає спарений застосунок iOS. Gateway не потребує relay-токена для всього розгортання.
    - Прив’язує кожну реєстрацію з relay-підтримкою до ідентичності gateway, з якою було спарено застосунок iOS, тому інший gateway не зможе повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Надсилання з relay-підтримкою застосовується лише до офіційних розповсюджуваних збірок, які зареєстровано через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації й надсилання потрапляв до одного й того самого розгортання relay.

    Наскрізний процес:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` у gateway.
    3. Спарте застосунок iOS із gateway і дозвольте підключитися як сесії node, так і сесії оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest та квитанції застосунку, а потім публікує payload `push.apns.register` з relay-підтримкою у спарений gateway.
    5. Gateway зберігає relay handle і дозвіл на надсилання, а потім використовує їх для `push.test`, сигналів пробудження та сигналів повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, перепідключіть застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновлює кешовану relay-реєстрацію замість повторного використання старого джерела relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається аварійним варіантом для розробки лише в loopback; не зберігайте HTTP URL relay у конфігурації.

    Див. [iOS App](/uk/platforms/ios#relay-backed-push-for-official-builds) для повного наскрізного процесу та [Authentication and trust flow](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

  </Accordion>

  <Accordion title="Налаштування Heartbeat (періодичні перевірки)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: рядок тривалості (`30m`, `2h`). Установіть `0m`, щоб вимкнути.
    - `target`: `last` | `none` | `<channel-id>` (наприклад, `discord`, `matrix`, `telegram` або `whatsapp`)
    - `directPolicy`: `allow` (типово) або `block` для цілей Heartbeat у стилі DM
    - Див. [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

  </Accordion>

  <Accordion title="Налаштування завдань Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: видаляти завершені ізольовані сесії запуску з `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: очищати `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Див. [Cron jobs](/uk/automation/cron-jobs) для огляду можливостей і прикладів CLI.

  </Accordion>

  <Accordion title="Налаштування Webhook (хуків)">
    Увімкніть HTTP-ендпоїнти Webhook у Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Примітка щодо безпеки:
    - Уважайте весь вміст payload hook/Webhook недовіреним введенням.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook виконується лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; використовуйте для вхідних Webhook окремий підшлях, наприклад `/hooks`.
    - Залишайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте чітко обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сесій, які може вибирати викликач.
    - Для агентів, керованих через hook, віддавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс sandboxing, де це можливо).

    Див. [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів mapping і інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштування маршрутизації з кількома агентами">
    Запускайте кілька ізольованих агентів з окремими робочими просторами та сесіями:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Див. [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/configuration-reference#multi-agent-routing) щодо правил прив’язки та профілів доступу для кожного агента.

  </Accordion>

  <Accordion title="Розділення конфігурації на кілька файлів ($include)">
    Використовуйте `$include`, щоб упорядкувати великі конфігурації:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Один файл**: замінює об’єкт, у якому міститься
    - **Масив файлів**: глибоко об’єднується за порядком (пізніші мають пріоритет)
    - **Сусідні ключі**: об’єднуються після include (перевизначають включені значення)
    - **Вкладені include**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: обчислюються відносно файлу, який включає
    - **Записи, якими керує OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      що підкріплений include одного файлу, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний наскрізний запис**: кореневі include, масиви include та include
      із сусідніми перевизначеннями завершуються без змін для записів, якими керує OpenClaw, замість
      сплощення конфігурації
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок розбору та циклічних include

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і застосовує зміни автоматично — для більшості параметрів ручний перезапуск не потрібен.

Прямі редагування файлу вважаються недовіреними, доки не пройдуть валідацію. Спостерігач
чекає, поки вщухнуть тимчасові записи/перейменування редактора, читає фінальний файл
і відхиляє некоректні зовнішні зміни, відновлюючи останню коректну конфігурацію. Записи конфігурації,
якими керує OpenClaw, використовують ту саму перевірку схемою перед записом; руйнівні пошкодження, такі
як видалення `gateway.mode` або зменшення файлу більш ніж наполовину, відхиляються
та зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите `Config auto-restored from last-known-good` або
`config reload restored last-known-good config` у журналах, перевірте відповідний
файл `.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім запустіть
`openclaw config validate`. Див. [Gateway troubleshooting](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для контрольного списку відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Безпечно застосовує зміни одразу. Для критичних змін автоматично виконує перезапуск.    |
| **`hot`**              | Застосовує лише безпечні зміни без перезапуску. Записує попередження, коли потрібен перезапуск — ви виконуєте його самі. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                  |
| **`off`**              | Вимикає відстеження файлу. Зміни набудуть чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується без перезапуску, а що потребує перезапуску

Більшість полів застосовуються без перезапуску та без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія           | Поля                                                              | Потрібен перезапуск? |
| ------------------- | ----------------------------------------------------------------- | -------------------- |
| Канали              | `channels.*`, `web` (WhatsApp) — усі вбудовані канали та канали plugin | Ні               |
| Агент і моделі      | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація       | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сесії та повідомлення | `session`, `messages`                                           | Ні                   |
| Інструменти та медіа | `tools`, `browser`, `skills`, `audio`, `talk`                    | Ні                   |
| UI та інше          | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура      | `discovery`, `canvasHost`, `plugins`                              | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` — винятки: їх зміна **не** призводить до перезапуску.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження на основі структури, визначеної у вихідних файлах, а не сплощеного представлення в пам’яті.
Це робить рішення для гарячого перезавантаження (застосувати без перезапуску чи перезапустити) передбачуваними навіть тоді, коли
один розділ верхнього рівня розміщено у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується без змін, якщо
структура джерела неоднозначна.

## RPC конфігурації (програмні оновлення)

Для інструментів, які записують конфігурацію через API gateway, віддавайте перевагу такому процесу:

- `config.schema.lookup`, щоб перевірити одне піддерево (поверхневий вузол схеми + короткі
  відомості про дочірні елементи)
- `config.get`, щоб отримати поточний знімок разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти об’єднуються, `null`
  видаляє, масиви замінюються)
- `config.apply` лише тоді, коли ви справді хочете замінити всю конфігурацію
- `update.run` для явного самостійного оновлення з подальшим перезапуском

<Note>
Записи контрольної площини (`config.apply`, `config.patch`, `update.run`) обмежуються
до 3 запитів на 60 секунд для кожної пари `deviceId+clientIp`. Запити на перезапуск
об’єднуються, а потім між циклами перезапуску застосовується затримка 30 секунд.
</Note>

Приклад часткового patch:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

І `config.apply`, і `config.patch` приймають `raw`, `baseHash`, `sessionKey`,
`note` і `restartDelayMs`. `baseHash` є обов’язковим для `config.patch` і
рекомендованим для `config.apply`, коли конфігурація вже існує.

## Змінні середовища

OpenClaw читає змінні середовища з батьківського процесу, а також з:

- `.env` у поточному робочому каталозі (якщо є)
- `~/.openclaw/.env` (глобальний запасний варіант)

Жоден із цих файлів не перевизначає вже наявні змінні середовища. Ви також можете задавати вбудовані змінні середовища в конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт змінних середовища оболонки (необов’язково)">
  Якщо ввімкнено і очікувані ключі не задано, OpenClaw запускає вашу login shell і імпортує лише відсутні ключі:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Еквівалентна змінна середовища: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Підстановка змінних середовища у значеннях конфігурації">
  Посилайтеся на змінні середовища в будь-якому рядковому значенні конфігурації за допомогою `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Правила:

- Зіставляються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні/порожні змінні спричиняють помилку під час завантаження
- Використовуйте `$${VAR}` для буквального виводу
- Працює всередині файлів `$include`
- Вбудована підстановка: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Посилання на секрети (env, file, exec)">
  Для полів, які підтримують об’єкти SecretRef, можна використовувати:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Подробиці про SecretRef (зокрема `secrets.providers` для `env`/`file`/`exec`) наведено в [Secrets Management](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [SecretRef Credential Surface](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Environment](/uk/help/environment) для повного опису пріоритетів і джерел.

## Повний довідник

Повний довідник по полях див. в **[Configuration Reference](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Configuration Examples](/uk/gateway/configuration-examples) · [Configuration Reference](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_
