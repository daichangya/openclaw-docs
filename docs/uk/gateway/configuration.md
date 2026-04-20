---
read_when:
    - Перше налаштування OpenClaw
    - Пошук поширених шаблонів конфігурації
    - Перехід до певних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-20T18:29:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 479e59fb8b57c5228ef1c6076cf80a4ce6064d3f6fad5f38ea9d75eeb92811dc
    source_path: gateway/configuration.md
    workflow: 15
---

# Конфігурація

OpenClaw зчитує необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Поширені причини додати конфігурацію:

- Підключити канали та керувати тим, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (Cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Перегляньте [повний довідник](/uk/gateway/configuration-reference), щоб побачити всі доступні поля.

<Tip>
**Новачок у конфігурації?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) з повними конфігураціями для копіювання й вставлення.
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
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
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
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і використовуйте вкладку **Config**.
    Control UI відображає форму з живої схеми конфігурації, включно з метаданими документації полів
    `title` / `description`, а також схемами Plugin і каналів, коли вони
    доступні, із редактором **Raw JSON** як запасним варіантом. Для деталізованих
    UI та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми для певного шляху разом із підсумками безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Редагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway відстежує файл і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, що повністю відповідають схемі. Невідомі ключі, некоректні типи або недійсні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на рівні кореня — `$schema` (рядок), щоб редактори могли приєднувати метадані JSON Schema.
</Warning>

Примітки щодо інструментів схеми:

- `openclaw config schema` виводить ту саму сім’ю JSON Schema, яку використовують Control UI
  і валідація конфігурації.
- Вважайте цей вивід схеми канонічним машиночитаним контрактом для
  `openclaw.json`; цей огляд і довідник конфігурації її узагальнюють.
- Значення полів `title` і `description` переносяться у вивід схеми для
  інструментів редактора та форм.
- Вкладені об’єкти, шаблонні (`*`) і елементи масивів (`[]`) успадковують ті самі
  метадані документації там, де існує відповідна документація поля.
- Гілки композиції `anyOf` / `oneOf` / `allOf` також успадковують ті самі
  метадані документації, тож варіанти union/intersection зберігають ту саму довідку по полях.
- `config.schema.lookup` повертає один нормалізований шлях конфігурації з неглибоким
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, типові межі
  та подібні поля валідації), відповідні метадані підказок UI і короткі описи
  безпосередніх дочірніх елементів для інструментів деталізації.
- Схеми Plugin/каналів під час виконання об’єднуються, коли gateway може завантажити
  поточний реєстр маніфестів.
- `pnpm config:docs:check` виявляє розбіжності між базовими артефактами конфігурації
  для документації та поточною поверхнею схеми.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway також зберігає довірену останню справну копію після успішного запуску. Якщо
`openclaw.json` пізніше змінено поза OpenClaw і він більше не проходить валідацію, під час запуску
і гарячого перезавантаження пошкоджений файл зберігається як знімок `.clobbered.*` із часовою позначкою,
відновлюється остання справна копія, а в журнал записується помітне попередження з причиною відновлення.
Під час наступного ходу головного агента він також отримує попередження системної події про те, що
конфігурацію було відновлено і її не можна бездумно перезаписувати. Просування останньої справної копії
оновлюється після перевіреного запуску та після прийнятих гарячих перезавантажень, зокрема
для записів конфігурації, виконаних самим OpenClaw, якщо хеш збереженого файла все ще збігається з прийнятим
записом. Просування пропускається, коли кандидат містить відредаговані заповнювачі секретів
на кшталт `***` або скорочені значення токенів.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Налаштувати канал (WhatsApp, Telegram, Discord тощо)">
    Кожен канал має власний розділ конфігурації в `channels.<provider>`. Перегляньте окрему сторінку каналу, щоб виконати налаштування:

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

    Усі канали використовують однаковий шаблон політики приватних повідомлень:

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

  <Accordion title="Вибрати й налаштувати моделі">
    Вкажіть основну модель і необов’язкові резервні варіанти:

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

    - `agents.defaults.models` визначає каталог моделей і слугує allowlist для `/model`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням масштабу зображень у транскрипті/інструментах (типове значення `1200`); менші значення зазвичай зменшують використання vision-токенів у сценаріях із великою кількістю знімків екрана.
    - Перегляньте [Models CLI](/uk/concepts/models), щоб перемикати моделі в чаті, і [Model Failover](/uk/concepts/model-failover), щоб дізнатися про ротацію автентифікації та поведінку резервних варіантів.
    - Для користувацьких/self-hosted провайдерів див. [Custom providers](/uk/gateway/configuration-reference#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може надсилати повідомлення боту">
    Доступ до приватних повідомлень контролюється окремо для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код сполучення для підтвердження
    - `"allowlist"`: лише відправники з `allowFrom` (або зі сховища дозволених сполучених користувачів)
    - `"open"`: дозволити всі вхідні приватні повідомлення (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі приватні повідомлення

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Докладні відомості для кожного каналу див. у [повному довіднику](/uk/gateway/configuration-reference#dm-and-group-access).

  </Accordion>

  <Accordion title="Налаштувати обмеження за згадкою в груповому чаті">
    Повідомлення в групах за замовчуванням **вимагають згадки**. Налаштуйте шаблони для кожного агента:

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

    - **Метадані згадок**: нативні @-згадки (WhatsApp tap-to-mention, Telegram @bot тощо)
    - **Текстові шаблони**: безпечні regex-шаблони в `mentionPatterns`
    - Докладніше про перевизначення для кожного каналу та режим self-chat див. у [повному довіднику](/uk/gateway/configuration-reference#group-chat-mention-gating).

  </Accordion>

  <Accordion title="Обмежити Skills для агента">
    Використовуйте `agents.defaults.skills` для спільної базової конфігурації, а потім перевизначайте
    окремих агентів через `agents.list[].skills`:

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
    - Установіть `agents.list[].skills: []`, щоб не дозволити жодних Skills.
    - Див. [Skills](/uk/tools/skills), [конфігурацію Skills](/uk/tools/skills-config) і
      [довідник конфігурації](/uk/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Налаштувати моніторинг стану каналів gateway">
    Керуйте тим, наскільки агресивно gateway перезапускає канали, які виглядають застарілими:

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

    - Установіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски моніторингу стану.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Див. [Health Checks](/uk/gateway/health) для операційної діагностики та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштувати сесії та скидання">
    Сесії керують безперервністю розмови та ізоляцією:

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
    - `threadBindings`: глобальні типові значення для маршрутизації сесій, прив’язаних до тредів (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сесіями](/uk/concepts/session) для відомостей про області дії, зв’язки ідентичностей і політику надсилання.
    - Усі поля див. у [повному довіднику](/uk/gateway/configuration-reference#session).

  </Accordion>

  <Accordion title="Увімкнути ізоляцію">
    Запускайте сесії агента в ізольованих runtime ізолятора:

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

    Повний посібник див. у [Sandboxing](/uk/gateway/sandboxing), а всі параметри — у [повному довіднику](/uk/gateway/configuration-reference#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Увімкнути push через relay для офіційних збірок iOS">
    Push через relay налаштовується в `openclaw.json`.

    Укажіть це в конфігурації gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Необов’язково. Типове значення: 10000
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

    - Дозволяє gateway надсилати `push.test`, сигнали пробудження і сигнали повторного підключення через зовнішній relay.
    - Використовує grant на надсилання в межах реєстрації, який пересилає сполучений застосунок iOS. Gateway не потребує relay-токена рівня всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності gateway, з якою було сполучено застосунок iOS, тож інший gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Надсилання через relay застосовується лише до офіційно розповсюджених збірок, що зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання потрапляв до того самого розгортання relay.

    Наскрізний процес:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` у gateway.
    3. Сполучіть застосунок iOS із gateway і дайте змогу підключитися як сесіям node, так і сесіям оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує payload `push.apns.register` через relay до сполученого gateway.
    5. Gateway зберігає relay handle і grant на надсилання, а потім використовує їх для `push.test`, сигналів пробудження і сигналів повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, перепідключіть застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, що вказує на інше розгортання relay, застосунок оновлює свій кешований relay-реєстраційний запис замість повторного використання старого джерела relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` як і раніше працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається тимчасовим засобом розробки лише для loopback; не зберігайте HTTP URL relay у конфігурації.

    Див. [застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного процесу і [процес автентифікації та довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

  </Accordion>

  <Accordion title="Налаштувати Heartbeat (періодичні перевірки зв’язку)">
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
    - Повний посібник див. у [Heartbeat](/uk/gateway/heartbeat).

  </Accordion>

  <Accordion title="Налаштувати Cron-завдання">
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

    - `sessionRetention`: видаляти завершені ізольовані сесії виконання з `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: обрізати `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Огляд можливостей і приклади CLI див. у [Cron jobs](/uk/automation/cron-jobs).

  </Accordion>

  <Accordion title="Налаштувати Webhook-и (hooks)">
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
    - Вважайте весь вміст payload hook/Webhook недовіреним введенням.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook виконується лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; тримайте вхідний трафік Webhook на окремому підшляху, наприклад `/hooks`.
    - Залишайте прапори обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузькоспрямоване налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сесій, які вибирає викликач.
    - Для агентів, що запускаються через hook, віддавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс ізоляція, де це можливо).

    Усі параметри мапінгу та інтеграцію Gmail див. у [повному довіднику](/uk/gateway/configuration-reference#hooks).

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію кількох агентів">
    Запускайте кількох ізольованих агентів з окремими робочими просторами та сесіями:

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

    Правила binding та профілі доступу для кожного агента див. у [Multi-Agent](/uk/concepts/multi-agent) і [повному довіднику](/uk/gateway/configuration-reference#multi-agent-routing).

  </Accordion>

  <Accordion title="Розділити конфігурацію на кілька файлів ($include)">
    Використовуйте `$include`, щоб упорядковувати великі конфігурації:

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

    - **Один файл**: замінює об’єкт-контейнер
    - **Масив файлів**: глибоко зливається по порядку (пізніший має пріоритет)
    - **Сусідні ключі**: зливаються після include-ів (перевизначають включені значення)
    - **Вкладені include-и**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: обчислюються відносно файла, що включає
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок парсингу та циклічних include-ів

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і автоматично застосовує зміни — для більшості налаштувань ручний перезапуск не потрібен.

Прямі редагування файла вважаються недовіреними, доки не пройдуть валідацію. Спостерігач чекає,
поки завершаться тимчасові записи/перейменування редактора, зчитує фінальний файл і відхиляє
некоректні зовнішні зміни, відновлюючи останню справну конфігурацію. Власні записи конфігурації OpenClaw
використовують той самий бар’єр схеми перед записом; руйнівні перезаписи на кшталт
видалення `gateway.mode` або зменшення файла більш ніж наполовину відхиляються
і зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите `Config auto-restored from last-known-good` або
`config reload restored last-known-good config` у логах, перегляньте відповідний
файл `.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім виконайте
`openclaw config validate`. Контрольний список відновлення див. у [усуненні несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config).

### Режими перезавантаження

| Режим                  | Поведінка                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускається для критичних.   |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Логує попередження, коли потрібен перезапуск — ви обробляєте це самі. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                   |
| **`off`**              | Вимикає відстеження файла. Зміни набирають чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гаряче, а що потребує перезапуску

Більшість полів застосовуються гаряче без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія           | Поля                                                                 | Потрібен перезапуск? |
| ------------------- | -------------------------------------------------------------------- | -------------------- |
| Канали              | `channels.*`, `web` (WhatsApp) — усі вбудовані канали й канали розширень | Ні               |
| Агент і моделі      | `agent`, `agents`, `models`, `routing`                               | Ні                   |
| Автоматизація       | `hooks`, `cron`, `agent.heartbeat`                                   | Ні                   |
| Сесії та повідомлення | `session`, `messages`                                              | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `audio`, `talk`                        | Ні                   |
| UI та інше          | `ui`, `logging`, `identity`, `bindings`                              | Ні                   |
| Сервер Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Так**              |
| Інфраструктура      | `discovery`, `canvasHost`, `plugins`                                 | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` є винятками — їх зміна **не** спричиняє перезапуск.
</Note>

## Config RPC (програмні оновлення)

<Note>
RPC керуючої площини для запису (`config.apply`, `config.patch`, `update.run`) мають обмеження швидкості: **3 запити за 60 секунд** на `deviceId+clientIp`. У разі обмеження RPC повертає `UNAVAILABLE` з `retryAfterMs`.
</Note>

Безпечний/типовий процес:

- `config.schema.lookup`: переглянути одне піддерево конфігурації з певною областю шляху з неглибоким
  вузлом схеми, відповідними метаданими підказок і короткими описами безпосередніх дочірніх елементів
- `config.get`: отримати поточний знімок + хеш
- `config.patch`: рекомендований шлях часткового оновлення
- `config.apply`: лише повна заміна конфігурації
- `update.run`: явне самооновлення + перезапуск

Якщо ви не замінюєте всю конфігурацію повністю, надавайте перевагу `config.schema.lookup`,
а потім `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (повна заміна)">
    Перевіряє + записує повну конфігурацію і перезапускає Gateway за один крок.

    <Warning>
    `config.apply` замінює **всю конфігурацію**. Для часткових оновлень використовуйте `config.patch`, а для окремих ключів — `openclaw config set`.
    </Warning>

    Параметри:

    - `raw` (string) — payload JSON5 для всієї конфігурації
    - `baseHash` (optional) — хеш конфігурації з `config.get` (обов’язковий, якщо конфігурація існує)
    - `sessionKey` (optional) — ключ сесії для ping пробудження після перезапуску
    - `note` (optional) — примітка для restart sentinel
    - `restartDelayMs` (optional) — затримка перед перезапуском (типово 2000)

    Запити на перезапуск об’єднуються, якщо один уже очікує/виконується, і між циклами перезапуску діє 30-секундний період охолодження.

    ```bash
    openclaw gateway call config.get --params '{}'  # capture payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (часткове оновлення)">
    Зливає часткове оновлення в наявну конфігурацію (семантика JSON merge patch):

    - Об’єкти зливаються рекурсивно
    - `null` видаляє ключ
    - Масиви замінюються

    Параметри:

    - `raw` (string) — JSON5 лише з тими ключами, які потрібно змінити
    - `baseHash` (required) — хеш конфігурації з `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — те саме, що й у `config.apply`

    Поведінка перезапуску відповідає `config.apply`: об’єднання відкладених перезапусків плюс 30-секундний період охолодження між циклами перезапуску.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Змінні середовища

OpenClaw зчитує змінні середовища з батьківського процесу, а також із:

- `.env` у поточному робочому каталозі (якщо наявний)
- `~/.openclaw/.env` (глобальний резервний варіант)

Жоден із цих файлів не перевизначає вже наявні змінні середовища. Ви також можете задавати вбудовані змінні середовища в конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт shell env (необов’язково)">
  Якщо це ввімкнено і очікувані ключі не задані, OpenClaw запускає вашу login shell і імпортує лише відсутні ключі:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Еквівалент змінної середовища: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Підстановка env var у значеннях конфігурації">
  Посилайтеся на змінні середовища в будь-якому рядковому значенні конфігурації за допомогою `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Правила:

- Зіставляються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні/порожні змінні спричиняють помилку під час завантаження
- Екрануйте як `$${VAR}` для буквального виводу
- Працює всередині файлів `$include`
- Вбудована підстановка: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef (env, file, exec)">
  Для полів, що підтримують об’єкти SecretRef, ви можете використовувати:

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

Докладно про SecretRef (включно з `secrets.providers` для `env`/`file`/`exec`) див. у [Керування секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних наведено в [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Повний пріоритет і джерела див. у розділі [Середовище](/uk/help/environment).

## Повний довідник

Повний довідник по полях див. у **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_
