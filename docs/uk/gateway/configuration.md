---
read_when:
    - Перше налаштування OpenClaw
    - Пошук поширених шаблонів конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-22T22:25:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2296617a25a339048cb1df7b895fec35e96b0740851c89add907fc49307e08d1
    source_path: gateway/configuration.md
    workflow: 15
---

# Конфігурація

OpenClaw читає необов’язковий конфігураційний файл <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Типові причини додати конфігурацію:

- Підключити канали та керувати тим, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (cron, hooks)
- Тонко налаштувати сеанси, медіа, мережу або UI

Перегляньте [повний довідник](/uk/gateway/configuration-reference), щоб побачити всі доступні поля.

<Tip>
**Вперше налаштовуєте конфігурацію?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) з повними конфігураціями для копіювання.
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
    Control UI відображає форму на основі живої схеми конфігурації, включно з
    метаданими документації полів `title` / `description`, а також схемами Plugin і каналів, коли
    вони доступні, з редактором **Raw JSON** як запасним варіантом. Для
    UI з деталізацією та інших інструментів gateway також надає `config.schema.lookup` для
    отримання одного вузла схеми, обмеженого шляхом, і підсумків його безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Відредагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway відстежує файл і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильні типи або недійсні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на рівні кореня — `$schema` (рядок), щоб редактори могли підключати метадані JSON Schema.
</Warning>

Примітки щодо інструментів схеми:

- `openclaw config schema` виводить ту саму сім’ю JSON Schema, яку використовують Control UI
  і валідація конфігурації.
- Розглядайте цей вивід схеми як канонічний машиночитний контракт для
  `openclaw.json`; цей огляд і довідник із конфігурації його узагальнюють.
- Значення полів `title` і `description` переносяться до виводу схеми для
  редакторів та інструментів форм.
- Вкладені об’єкти, шаблони (`*`) та елементи масиву (`[]`) успадковують ті самі
  метадані документації, якщо для відповідного поля існує документація.
- Гілки композицій `anyOf` / `oneOf` / `allOf` також успадковують ті самі
  метадані документації, тож варіанти union/intersection зберігають ту саму довідку полів.
- `config.schema.lookup` повертає один нормалізований шлях конфігурації з поверхневим
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, поширені обмеження
  та подібні поля валідації), відповідними метаданими підказок UI і підсумками
  безпосередніх дочірніх елементів для інструментів деталізації.
- Схеми Plugin/каналів часу виконання об’єднуються, коли gateway може завантажити
  поточний реєстр маніфестів.
- `pnpm config:docs:check` виявляє розбіжності між артефактами базових конфігурацій,
  орієнтованими на документацію, і поточною поверхнею схеми.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Виконайте `openclaw doctor`, щоб побачити точні проблеми
- Виконайте `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway також зберігає довірену останню коректну копію після успішного запуску. Якщо
`openclaw.json` пізніше буде змінено поза OpenClaw і він перестане проходити валідацію, запуск
і гаряче перезавантаження збережуть пошкоджений файл як позначений часом знімок `.clobbered.*`,
відновлять останню коректну копію та запишуть помітне попередження з причиною відновлення.
Якщо перед інакше коректною JSON-конфігурацією випадково буде додано рядок статусу/журналу,
запуск gateway і `openclaw doctor --fix` можуть прибрати цей префікс,
зберегти забруднений файл як `.clobbered.*` і продовжити роботу з відновленим
JSON.
Наступний хід основного агента також отримує попередження про системну подію, яке повідомляє, що
конфігурацію було відновлено і її не можна бездумно перезаписувати. Оновлення останньої коректної версії
відбувається після валідованого запуску та після прийнятих гарячих перезавантажень, включно з
записами конфігурації, виконаними самим OpenClaw, якщо хеш збереженого файлу все ще збігається з прийнятим
записом. Оновлення пропускається, якщо кандидат містить замасковані заповнювачі секретів
на кшталт `***` або скорочені значення токенів.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Налаштувати канал (WhatsApp, Telegram, Discord тощо)">
    Кожен канал має власний розділ конфігурації в `channels.<provider>`. Перегляньте окрему сторінку каналу для кроків налаштування:

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

    Усі канали використовують однаковий шаблон політики особистих повідомлень:

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

  <Accordion title="Вибрати та налаштувати моделі">
    Встановіть основну модель і необов’язкові резервні варіанти:

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
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи allowlist без видалення наявних моделей. Звичайні заміни, які призвели б до видалення записів, відхиляються, якщо не передати `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням розміру зображень у транскриптах/інструментах (типове значення `1200`); менші значення зазвичай зменшують використання vision-token у сценаріях із великою кількістю скриншотів.
    - Див. [Models CLI](/uk/concepts/models), щоб перемикати моделі в чаті, і [Model Failover](/uk/concepts/model-failover) щодо ротації автентифікації та поведінки резервного перемикання.
    - Для користувацьких/self-hosted провайдерів див. [Custom providers](/uk/gateway/configuration-reference#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може надсилати повідомлення боту">
    Доступ до особистих повідомлень керується окремо для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код pairing для схвалення
    - `"allowlist"`: лише відправники з `allowFrom` (або зі сховища парного allow)
    - `"open"`: дозволити всі вхідні особисті повідомлення (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі особисті повідомлення

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Див. [повний довідник](/uk/gateway/configuration-reference#dm-and-group-access) для деталей по кожному каналу.

  </Accordion>

  <Accordion title="Налаштувати вимогу згадки в групових чатах">
    Групові повідомлення типово **вимагають згадки**. Налаштуйте шаблони для кожного агента:

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

    - **Metadata mentions**: нативні @-згадки (WhatsApp tap-to-mention, Telegram @bot тощо)
    - **Text patterns**: безпечні шаблони regex у `mentionPatterns`
    - Див. [повний довідник](/uk/gateway/configuration-reference#group-chat-mention-gating) для перевизначень на рівні каналів і режиму self-chat.

  </Accordion>

  <Accordion title="Обмежити Skills для агента">
    Використовуйте `agents.defaults.skills` для спільного базового набору, а потім перевизначайте конкретні
    агенти через `agents.list[].skills`:

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

    - Не вказуйте `agents.defaults.skills`, щоб типово не обмежувати Skills.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
    - Установіть `agents.list[].skills: []`, щоб не було Skills.
    - Див. [Skills](/uk/tools/skills), [конфігурація Skills](/uk/tools/skills-config) і
      [Довідник із конфігурації](/uk/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Тонко налаштувати моніторинг стану каналів gateway">
    Керуйте тим, наскільки агресивно gateway перезапускає канали, які виглядають неактивними:

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

    - Встановіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски монітору стану.
    - `channelStaleEventThresholdMinutes` має бути більшим або рівним інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного каналу або облікового запису без вимкнення глобального моніторингу.
    - Див. [Health Checks](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштувати сеанси та скидання">
    Сеанси керують безперервністю розмови та ізоляцією:

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

    - `dmScope`: `main` (спільний) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: глобальні значення за замовчуванням для маршрутизації сеансів, прив’язаних до гілок (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сеансами](/uk/concepts/session) щодо області видимості, зв’язків ідентичності та політики надсилання.
    - Див. [повний довідник](/uk/gateway/configuration-reference#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнути ізоляцію">
    Запускайте сеанси агента в ізольованих середовищах sandbox:

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

  <Accordion title="Увімкнути push через relay для офіційних збірок iOS">
    Push через relay налаштовується в `openclaw.json`.

    Установіть це в конфігурації gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Необов’язково. Типово: 10000
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

    - Дозволяє gateway надсилати `push.test`, сигнали пробудження та сигнали повторного підключення через зовнішній relay.
    - Використовує грант надсилання в межах реєстрації, який пересилає спарений застосунок iOS. Gateway не потрібен токен relay для всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності gateway, з якою був спарений застосунок iOS, тому інший gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Надсилання через relay застосовується лише до офіційних розповсюджуваних збірок, які зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання потрапляв до того самого розгортання relay.

    Наскрізний процес:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` у gateway.
    3. Спарте застосунок iOS із gateway і дозвольте підключитися сеансам node та оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує корисне навантаження `push.apns.register` через relay до спареного gateway.
    5. Gateway зберігає дескриптор relay і грант надсилання, а потім використовує їх для `push.test`, сигналів пробудження та повторного підключення.

    Операційні примітки:

    - Якщо ви перемкнете застосунок iOS на інший gateway, повторно підключіть застосунок, щоб він міг опублікувати нову реєстрацію relay, прив’язану до цього gateway.
    - Якщо ви випустите нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновить кешовану реєстрацію relay замість повторного використання старого джерела relay.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається аварійним варіантом для розробки лише на loopback; не зберігайте URL relay з HTTP у конфігурації.

    Див. [застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного процесу та [Потік автентифікації й довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

  </Accordion>

  <Accordion title="Налаштувати Heartbeat (періодичні перевірки)">
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
    - `directPolicy`: `allow` (типово) або `block` для цілей Heartbeat у стилі особистих повідомлень
    - Див. [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

  </Accordion>

  <Accordion title="Налаштувати Cron jobs">
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

    - `sessionRetention`: видаляти завершені ізольовані сеанси запуску з `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: очищати `cron/runs/<jobId>.jsonl` за розміром і кількістю рядків, що зберігаються.
    - Див. [Cron jobs](/uk/automation/cron-jobs) для огляду можливостей і прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати Webhook (hooks)">
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
    - Вважайте весь вміст корисного навантаження hook/Webhook недовіреним вводом.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; залишайте вхід Webhook на окремому підшляху, наприклад `/hooks`.
    - Залишайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузькоспеціалізоване налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сеансів, які може вибирати викликач.
    - Для агентів, керованих через hook, надавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс sandboxing, де це можливо).

    Див. [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів зіставлення та інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію між кількома агентами">
    Запускайте кілька ізольованих агентів з окремими робочими просторами та сеансами:

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

    Див. [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/configuration-reference#multi-agent-routing) для правил прив’язки та профілів доступу для кожного агента.

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

    - **Один файл**: замінює об’єкт, у якому міститься
    - **Масив файлів**: об’єднується через deep-merge у вказаному порядку (пізніші мають пріоритет)
    - **Сусідні ключі**: об’єднуються після include (перевизначають включені значення)
    - **Вкладені include**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: обчислюються відносно файла, який включає
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок парсингу та циклічних include

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і автоматично застосовує зміни — для більшості налаштувань ручний перезапуск не потрібен.

Прямі зміни файлу вважаються недовіреними, доки не пройдуть валідацію. Спостерігач чекає,
поки завершаться тимчасові записи/перейменування редактора, читає остаточний файл і відхиляє
недійсні зовнішні зміни, відновлюючи останню коректну конфігурацію. Записи конфігурації,
виконані самим OpenClaw, використовують ту саму схему перевірки перед записом; руйнівні перезаписи,
наприклад видалення `gateway.mode` або зменшення файлу більш ніж удвічі, відхиляються
і зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите `Config auto-restored from last-known-good` або
`config reload restored last-known-good config` у журналах, перегляньте відповідний
файл `.clobbered.*` поруч із `openclaw.json`, виправте відхилене корисне навантаження, а потім виконайте
`openclaw config validate`. Див. [Усунення проблем Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для контрольного списку відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускається для критичних.   |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Логує попередження, коли потрібен перезапуск — ви обробляєте це самі. |
| **`restart`**          | Перезапускає Gateway при будь-якій зміні конфігурації, безпечній чи ні.                 |
| **`off`**              | Вимикає відстеження файлу. Зміни набувають чинності при наступному ручному перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гаряче, а що потребує перезапуску

Більшість полів застосовуються гаряче без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія          | Поля                                                              | Потрібен перезапуск? |
| ------------------ | ----------------------------------------------------------------- | -------------------- |
| Канали             | `channels.*`, `web` (WhatsApp) — усі вбудовані канали та канали Plugin | Ні               |
| Агент і моделі     | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація      | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сеанси й повідомлення | `session`, `messages`                                         | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `audio`, `talk`                    | Ні                   |
| UI та інше         | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура     | `discovery`, `canvasHost`, `plugins`                              | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` — винятки: їхня зміна **не** спричиняє перезапуск.
</Note>

## Config RPC (програмні оновлення)

<Note>
RPC control plane для запису (`config.apply`, `config.patch`, `update.run`) мають обмеження швидкості: **3 запити за 60 секунд** на `deviceId+clientIp`. При спрацюванні обмеження RPC повертає `UNAVAILABLE` з `retryAfterMs`.
</Note>

Безпечний/типовий процес:

- `config.schema.lookup`: перевірити одне піддерево конфігурації, обмежене шляхом, з поверхневим
  вузлом схеми, відповідними метаданими підказок і підсумками безпосередніх дочірніх елементів
- `config.get`: отримати поточний знімок + хеш
- `config.patch`: бажаний шлях часткового оновлення
- `config.apply`: лише повна заміна конфігурації
- `update.run`: явне самооновлення + перезапуск

Коли ви не замінюєте всю конфігурацію, надавайте перевагу `config.schema.lookup`,
а потім `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (повна заміна)">
    Перевіряє + записує повну конфігурацію та перезапускає Gateway за один крок.

    <Warning>
    `config.apply` замінює **всю конфігурацію**. Використовуйте `config.patch` для часткових оновлень або `openclaw config set` для окремих ключів.
    </Warning>

    Параметри:

    - `raw` (string) — корисне навантаження JSON5 для всієї конфігурації
    - `baseHash` (optional) — хеш конфігурації з `config.get` (обов’язковий, якщо конфігурація існує)
    - `sessionKey` (optional) — ключ сеансу для ping пробудження після перезапуску
    - `note` (optional) — примітка для sentinel перезапуску
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
    Об’єднує часткове оновлення з наявною конфігурацією (семантика JSON merge patch):

    - Об’єкти об’єднуються рекурсивно
    - `null` видаляє ключ
    - Масиви замінюються

    Параметри:

    - `raw` (string) — JSON5 лише з ключами, які потрібно змінити
    - `baseHash` (required) — хеш конфігурації з `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — такі самі, як у `config.apply`

    Поведінка перезапуску збігається з `config.apply`: об’єднання відкладених перезапусків і 30-секундний період охолодження між циклами перезапуску.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

## Змінні середовища

OpenClaw читає змінні середовища з батьківського процесу, а також з:

- `.env` у поточному робочому каталозі (якщо є)
- `~/.openclaw/.env` (глобальний резервний варіант)

Жоден із цих файлів не перевизначає вже наявні змінні середовища. Ви також можете встановлювати вбудовані змінні середовища в конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт shell env (необов’язково)">
  Якщо це ввімкнено й очікувані ключі не встановлені, OpenClaw запускає вашу login shell і імпортує лише відсутні ключі:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Еквівалент через env var: `OPENCLAW_LOAD_SHELL_ENV=1`
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

- Збігаються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні/порожні змінні спричиняють помилку під час завантаження
- Екрануйте через `$${VAR}` для буквального виводу
- Працює всередині файлів `$include`
- Вбудована підстановка: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Посилання на секрети (env, file, exec)">
  Для полів, що підтримують об’єкти SecretRef, можна використовувати:

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

Докладніше про SecretRef (включно з `secrets.providers` для `env`/`file`/`exec`) див. у [Керування секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Середовище](/uk/help/environment) для повного порядку пріоритетів і джерел.

## Повний довідник

Повний довідник по полях див. у **[Довідник із конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник із конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_
