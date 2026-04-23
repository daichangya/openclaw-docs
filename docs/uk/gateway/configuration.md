---
read_when:
    - Перше налаштування OpenClaw
    - Пошук поширених шаблонів конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-23T07:12:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8130d29e9fbf5104d0a76f26b26186b6aab2b211030b8c8ba0d1131daf890993
    source_path: gateway/configuration.md
    workflow: 15
---

# Конфігурація

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях до конфігурації має бути звичайним файлом. Макети
`openclaw.json` із symlink не підтримуються для записів, якими керує OpenClaw;
атомарний запис може замінити шлях замість збереження symlink. Якщо ви
зберігаєте конфігурацію поза типовим каталогом стану, вкажіть
`OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні типові значення. Поширені причини додати конфігурацію:

- Підключити канали та контролювати, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Дивіться [повний довідник](/uk/gateway/configuration-reference) для всіх доступних полів.

<Tip>
**Вперше працюєте з конфігурацією?** Почніть із `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) для готових конфігурацій, які можна скопіювати й вставити.
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
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і використовуйте вкладку **Config**.
    Control UI рендерить форму з живої схеми конфігурації, включно з
    метаданими документації полів `title` / `description`, а також схемами Plugin і каналів,
    коли вони доступні, з редактором **Raw JSON** як запасним варіантом. Для
    інтерфейсів із поглибленим переглядом та інших інструментів gateway також
    надає `config.schema.lookup`, щоб отримати один вузол схеми для заданого шляху
    разом із підсумками безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Відредагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway відстежує файл і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Строга валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильні типи або недійсні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на рівні кореня — `$schema` (рядок), щоб редактори могли підключати метадані JSON Schema.
</Warning>

Примітки щодо інструментів схеми:

- `openclaw config schema` виводить ту саму сім’ю JSON Schema, яку використовують Control UI
  і валідація конфігурації.
- Розглядайте цей вивід схеми як канонічний машинозчитуваний контракт для
  `openclaw.json`; цей огляд і довідник конфігурації його узагальнюють.
- Значення полів `title` і `description` переносяться у вивід схеми для
  редакторів і інструментів форм.
- Вкладені об’єкти, записи wildcard (`*`) і записи елементів масиву (`[]`) успадковують ті самі
  метадані документації там, де існує відповідна документація поля.
- Гілки композиції `anyOf` / `oneOf` / `allOf` також успадковують ті самі
  метадані документації, тому варіанти union/intersection зберігають ті самі підказки для полів.
- `config.schema.lookup` повертає один нормалізований шлях конфігурації з неглибоким
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, поширені межі
  та подібні поля валідації), відповідними метаданими UI-підказок і підсумками
  безпосередніх дочірніх елементів для інструментів із поглибленим переглядом.
- Схеми Plugin/каналів часу виконання об’єднуються, коли gateway може завантажити
  поточний реєстр маніфестів.
- `pnpm config:docs:check` виявляє розходження між артефактами базової конфігурації
  для документації та поточною поверхнею схеми.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Виконайте `openclaw doctor`, щоб побачити точні проблеми
- Виконайте `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway також зберігає довірену останню відому коректну копію після успішного запуску. Якщо
`openclaw.json` пізніше змінено поза OpenClaw і він більше не проходить валідацію, запуск
і гаряче перезавантаження зберігають пошкоджений файл як знімок `.clobbered.*` з часовою міткою,
відновлюють останню відому коректну копію та записують помітне попередження з причиною відновлення.
Відновлення під час читання на запуску також трактує різке зменшення розміру, відсутність метаданих конфігурації та
відсутній `gateway.mode` як критичні ознаки пошкодження, коли остання відома коректна
копія містила ці поля.
Якщо перед інакше коректною JSON-конфігурацією випадково додається рядок статусу/журналу,
запуск gateway і `openclaw doctor --fix` можуть видалити цей префікс,
зберегти забруднений файл як `.clobbered.*` і продовжити роботу з відновленим
JSON.
Наступний хід основного агента також отримує попередження через системну подію про те, що
конфігурацію було відновлено і її не можна бездумно перезаписувати. Просування останньої відомої коректної копії
оновлюється після валідованого запуску та після прийнятих гарячих перезавантажень, включно з
записами конфігурації, якими керує OpenClaw, якщо хеш збереженого файла все ще збігається з прийнятим
записом. Просування пропускається, коли кандидат містить відредаговані
placeholder-и секретів, такі як `***` або скорочені значення токенів.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Налаштування каналу (WhatsApp, Telegram, Discord тощо)">
    Кожен канал має власний розділ конфігурації в `channels.<provider>`. Дивіться окрему сторінку каналу для кроків налаштування:

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
          allowFrom: ["tg:123"], // лише для allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Вибір і налаштування моделей">
    Установіть основну модель і необов’язкові fallback:

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

    - `agents.defaults.models` визначає каталог моделей і працює як allowlist для `/model`.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи до allowlist без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо ви не передасте `--replace`.
    - Посилання на модель використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням масштабу зображень транскрипту/інструментів (типово `1200`); менші значення зазвичай зменшують використання vision-токенів під час запусків із великою кількістю знімків екрана.
    - Дивіться [Models CLI](/uk/concepts/models) для перемикання моделей у чаті та [Model Failover](/uk/concepts/model-failover) для ротації автентифікації та поведінки fallback.
    - Для користувацьких/self-hosted provider дивіться [Користувацькі providers](/uk/gateway/configuration-reference#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Контроль того, хто може надсилати повідомлення боту">
    Доступ до DM контролюється для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код pairing для підтвердження
    - `"allowlist"`: лише відправники з `allowFrom` (або зі сховища paired allow)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist-и, специфічні для каналу.

    Дивіться [повний довідник](/uk/gateway/configuration-reference#dm-and-group-access) для деталей по каналах.

  </Accordion>

  <Accordion title="Налаштування gating згадок у груповому чаті">
    Повідомлення в групах типово **вимагають згадки**. Налаштовуйте шаблони для кожного агента:

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
    - **Текстові шаблони**: безпечні regex-шаблони в `mentionPatterns`
    - Дивіться [повний довідник](/uk/gateway/configuration-reference#group-chat-mention-gating) для перевизначень по каналах і режиму self-chat.

  </Accordion>

  <Accordion title="Обмеження Skills для кожного агента">
    Використовуйте `agents.defaults.skills` для спільної базової конфігурації, а потім перевизначайте конкретні
    агенти через `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // успадковує github, weather
          { id: "docs", skills: ["docs-search"] }, // замінює типові значення
          { id: "locked-down", skills: [] }, // без Skills
        ],
      },
    }
    ```

    - Не вказуйте `agents.defaults.skills`, щоб типово Skills не були обмежені.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати типові значення.
    - Установіть `agents.list[].skills: []`, щоб не було Skills.
    - Дивіться [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і
      [Довідник конфігурації](/uk/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Налаштування моніторингу стану каналів gateway">
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

    - Установіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски за моніторингом стану.
    - `channelStaleEventThresholdMinutes` має бути більшим або дорівнювати інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного каналу або облікового запису без вимкнення глобального монітора.
    - Дивіться [Перевірки стану](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштування сесій і скидань">
    Сесії керують безперервністю розмови та ізоляцією:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // рекомендовано для багатокористувацького режиму
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
    - `threadBindings`: глобальні типові значення для маршрутизації сесій, прив’язаних до гілок (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Дивіться [Керування сесіями](/uk/concepts/session) для області видимості, зв’язків ідентичності та політики надсилання.
    - Дивіться [повний довідник](/uk/gateway/configuration-reference#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнення ізоляції">
    Запускайте сесії агента в ізольованих середовищах sandbox:

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

    Дивіться [Ізоляція](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/configuration-reference#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнення relay-backed push для офіційних збірок iOS">
    Relay-backed push налаштовується в `openclaw.json`.

    Установіть у конфігурації gateway таке:

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

    Що це дає:

    - Дає змогу gateway надсилати `push.test`, сигнали пробудження та сигнали пробудження для перепідключення через зовнішній relay.
    - Використовує прив’язаний до реєстрації дозвіл на надсилання, який пересилає спарений застосунок iOS. Gateway не потребує relay-токена для всього розгортання.
    - Прив’язує кожну relay-backed реєстрацію до ідентичності gateway, з якою застосунок iOS було спарено, тож інший gateway не зможе повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Relay-backed надсилання застосовується лише до офіційних поширюваних збірок, які зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації й надсилання досягав того самого розгортання relay.

    Наскрізний процес:

    1. Установіть офіційну/TestFlight збірку iOS, зібрану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` у gateway.
    3. Спарте застосунок iOS із gateway і дозвольте підключитися як сесії node, так і сесії оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує relay-backed payload `push.apns.register` у спарений gateway.
    5. Gateway зберігає relay handle і дозвіл на надсилання, а потім використовує їх для `push.test`, сигналів пробудження та сигналів пробудження для перепідключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, перепідключіть застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, що вказує на інше розгортання relay, застосунок оновлює свій кешований relay-запис замість повторного використання старого relay-origin.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається засобом для розробки лише через loopback; не зберігайте HTTP URL relay у конфігурації.

    Дивіться [Застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного процесу та [Автентифікація і модель довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

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
    - Дивіться [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

  </Accordion>

  <Accordion title="Налаштування cron-завдань">
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

    - `sessionRetention`: очищати завершені сесії ізольованих запусків із `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: очищати `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Дивіться [Cron jobs](/uk/automation/cron-jobs) для огляду можливостей і прикладів CLI.

  </Accordion>

  <Accordion title="Налаштування Webhook-ів (hooks)">
    Увімкніть HTTP-кінцеві точки Webhook на Gateway:

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
    - Уважайте весь вміст payload hook/Webhook ненадійним вхідним даними.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook виконується лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; тримайте вхідний Webhook-трафік на окремому підшляху, наприклад `/hooks`.
    - Залишайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузькоспрямоване налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сесій, які обирає викликач.
    - Для агентів, що запускаються через hook, надавайте перевагу потужним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише повідомлення плюс sandboxing, де це можливо).

    Дивіться [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів mappings та інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштування маршрутизації між кількома агентами">
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

    Дивіться [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/configuration-reference#multi-agent-routing) для правил bindings і профілів доступу для кожного агента.

  </Accordion>

  <Accordion title="Розділення конфігурації на кілька файлів ($include)">
    Використовуйте `$include` для організації великих конфігурацій:

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
    - **Масив файлів**: глибоко об’єднується в указаному порядку (пізніші значення мають пріоритет)
    - **Сусідні ключі**: об’єднуються після includes (перевизначають включені значення)
    - **Вкладені includes**: підтримуються до 10 рівнів глибини
    - **Відносні шляхи**: обчислюються відносно файла, який виконує включення
    - **Записи, якими керує OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      підкріплений include одного файла, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний наскрізний запис**: кореневі includes, масиви include і includes
      із сусідніми перевизначеннями аварійно завершуються для записів, якими керує OpenClaw, замість
      сплощення конфігурації
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок парсингу та циклічних includes

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і автоматично застосовує зміни — для більшості параметрів ручний перезапуск не потрібен.

Прямі редагування файла вважаються ненадійними, доки не пройдуть валідацію. Спостерігач
чекає, доки тимчасові записи/перейменування редактора стабілізуються, читає
підсумковий файл і відхиляє недійсні зовнішні зміни, відновлюючи останню відому коректну конфігурацію. Записи конфігурації,
якими керує OpenClaw, використовують той самий контроль через схему перед записом; руйнівні пошкодження, такі
як видалення `gateway.mode` або зменшення файла більш ніж наполовину, відхиляються
і зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите в журналах `Config auto-restored from last-known-good` або
`config reload restored last-known-good config`, перевірте відповідний
файл `.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім виконайте
`openclaw config validate`. Дивіться [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для контрольного списку відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускається для критичних. |
| **`hot`**              | Лише гаряче застосовує безпечні зміни. Записує попередження, коли потрібен перезапуск — ви обробляєте це самі. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                |
| **`off`**              | Вимикає відстеження файла. Зміни набудуть чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гаряче, а що потребує перезапуску

Більшість полів застосовуються гаряче без простою. У режимі `hybrid` зміни, які потребують перезапуску, обробляються автоматично.

| Категорія         | Поля                                                             | Потрібен перезапуск? |
| ----------------- | ---------------------------------------------------------------- | -------------------- |
| Канали            | `channels.*`, `web` (WhatsApp) — усі вбудовані канали та канали Plugin | Ні               |
| Агент і моделі    | `agent`, `agents`, `models`, `routing`                           | Ні                   |
| Автоматизація     | `hooks`, `cron`, `agent.heartbeat`                               | Ні                   |
| Сесії й повідомлення | `session`, `messages`                                         | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `audio`, `talk`                 | Ні                   |
| UI та інше        | `ui`, `logging`, `identity`, `bindings`                          | Ні                   |
| Сервер Gateway    | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)             | **Так**              |
| Інфраструктура    | `discovery`, `canvasHost`, `plugins`                             | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` — винятки: їх зміна **не** спричиняє перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження на основі макета, створеного у вихідному файлі, а не сплощеного представлення в пам’яті.
Це робить рішення гарячого перезавантаження (гаряче застосування чи перезапуск) передбачуваними навіть тоді, коли
один розділ верхнього рівня міститься у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`.

Якщо перезавантаження не можна безпечно спланувати — наприклад, через те, що вихідний макет
поєднує кореневі includes із сусідніми перевизначеннями — OpenClaw аварійно завершує таку спробу, записує
причину в журнал і залишає поточну запущену конфігурацію без змін, щоб ви могли виправити
форму джерела замість мовчазного переходу до сплощеного перезавантаження.

## RPC конфігурації (програмні оновлення)

<Note>
RPC запису control-plane (`config.apply`, `config.patch`, `update.run`) мають обмеження частоти: **3 запити на 60 секунд** для кожної пари `deviceId+clientIp`. Якщо ліміт перевищено, RPC повертає `UNAVAILABLE` з `retryAfterMs`.
</Note>

Безпечний/типовий процес:

- `config.schema.lookup`: переглянути одне піддерево конфігурації для заданого шляху з неглибоким
  вузлом схеми, відповідними метаданими підказок і підсумками безпосередніх дочірніх елементів
- `config.get`: отримати поточний знімок + hash
- `config.patch`: бажаний шлях часткового оновлення
- `config.apply`: лише повна заміна конфігурації
- `update.run`: явне самостійне оновлення + перезапуск

Коли ви не замінюєте всю конфігурацію повністю, надавайте перевагу `config.schema.lookup`,
а потім `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (повна заміна)">
    Валідовує + записує повну конфігурацію та перезапускає Gateway одним кроком.

    <Warning>
    `config.apply` замінює **всю конфігурацію**. Використовуйте `config.patch` для часткових оновлень або `openclaw config set` для окремих ключів.
    </Warning>

    Параметри:

    - `raw` (string) — payload JSON5 для всієї конфігурації
    - `baseHash` (необов’язково) — hash конфігурації з `config.get` (обов’язковий, якщо конфігурація існує)
    - `sessionKey` (необов’язково) — ключ сесії для ping пробудження після перезапуску
    - `note` (необов’язково) — примітка для sentinel перезапуску
    - `restartDelayMs` (необов’язково) — затримка перед перезапуском (типово 2000)

    Запити на перезапуск об’єднуються, якщо один уже очікує/виконується, і між циклами перезапуску діє 30-секундний cooldown.

    ```bash
    openclaw gateway call config.get --params '{}'  # зафіксувати payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (часткове оновлення)">
    Об’єднує часткове оновлення з наявною конфігурацією (семантика JSON merge patch):

    - Об’єкти об’єднуються рекурсивно
    - `null` видаляє ключ
    - Масиви замінюються

    Параметри:

    - `raw` (string) — JSON5 лише з ключами, які треба змінити
    - `baseHash` (обов’язково) — hash конфігурації з `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — те саме, що і для `config.apply`

    Поведінка перезапуску відповідає `config.apply`: об’єднання очікуваних перезапусків плюс 30-секундний cooldown між циклами перезапуску.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Змінні середовища

OpenClaw читає env vars із батьківського процесу, а також із:

- `.env` з поточного робочого каталогу (якщо є)
- `~/.openclaw/.env` (глобальний fallback)

Жоден із цих файлів не перевизначає наявні env vars. Ви також можете задавати вбудовані env vars у конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт shell env (необов’язково)">
  Якщо цю можливість увімкнено і очікувані ключі не задано, OpenClaw запускає вашу login shell і імпортує лише відсутні ключі:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Еквівалент env var: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Підстановка env var у значеннях конфігурації">
  Посилайтеся на env vars у будь-якому рядковому значенні конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Правила:

- Зіставляються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні/порожні vars спричиняють помилку під час завантаження
- Екрануйте через `$${VAR}` для буквального виводу
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

Деталі SecretRef (включно з `secrets.providers` для `env`/`file`/`exec`) наведено в [Керування секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [SecretRef Credential Surface](/uk/reference/secretref-credential-surface).
</Accordion>

Дивіться [Environment](/uk/help/environment) для повного порядку пріоритетів і джерел.

## Повний довідник

Повний довідник по полях дивіться в **[Довіднику конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_
