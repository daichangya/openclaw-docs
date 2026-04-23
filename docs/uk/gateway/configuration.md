---
read_when:
    - Перше налаштування OpenClaw
    - Пошук поширених шаблонів конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повну довідку'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-23T22:59:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: befbb9bee0af72961bd1e68c14886cfb3d0561990e318f253708eec6b4ad2ad9
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Макети
`openclaw.json` із символічними посиланнями не підтримуються для записів, якими керує OpenClaw; атомарний запис може замінити
цей шлях замість збереження символічного посилання. Якщо ви зберігаєте конфігурацію поза
типовим каталогом стану, спрямуйте `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Поширені причини додати конфігурацію:

- Підключити канали та контролювати, хто може писати боту
- Налаштувати моделі, інструменти, sandboxing або автоматизацію (Cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Див. [повну довідку](/uk/gateway/configuration-reference), щоб переглянути всі доступні поля.

<Tip>
**Уперше налаштовуєте конфігурацію?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) з готовими повними конфігураціями для копіювання.
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
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # повний потік початкового налаштування
    openclaw configure     # майстер конфігурації
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Відкрийте [http://127.0.0.1:18789](http://127.0.0.1:18789) і скористайтеся вкладкою **Конфігурація**.
    Control UI відображає форму з живої схеми конфігурації, зокрема метадані документації полів
    `title` / `description`, а також схеми plugin і каналів, коли вони
    доступні, з редактором **Raw JSON** як аварійним варіантом. Для UI
    з детальним переходом та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми з обмеженням за шляхом плюс підсумки безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Direct edit">
    Відредагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway стежить за файлом і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильні типи або недійсні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли додавати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують Control UI
і валідація. `config.schema.lookup` отримує один вузол із обмеженням за шляхом плюс
підсумки дочірніх елементів для інструментів із детальним переходом. Метадані документації полів `title`/`description`
поширюються на вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) і гілки `anyOf`/
`oneOf`/`allOf`. Схеми plugin і каналів часу виконання зливаються, коли
завантажено реєстр маніфестів.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену останню відому справну копію після кожного успішного запуску.
Якщо `openclaw.json` згодом не проходить валідацію (або втрачає `gateway.mode`, різко
зменшується, або на початок випадково додається рядок журналу), OpenClaw зберігає зламаний файл
як `.clobbered.*`, відновлює останню відому справну копію та записує причину
відновлення в журнал. Наступний хід агента також отримує попередження про системну подію, щоб основний
агент не переписав відновлену конфігурацію навмання. Підвищення до статусу останньої відомої справної копії
пропускається, якщо кандидат містить замасковані заповнювачі секретів, як-от `***`.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Налаштувати канал (WhatsApp, Telegram, Discord тощо)">
    Кожен канал має власний розділ конфігурації в `channels.<provider>`. Див. окрему сторінку каналу для кроків налаштування:

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

  <Accordion title="Вибрати й налаштувати моделі">
    Установіть основну модель і необов’язкові резервні:

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

    - `agents.defaults.models` визначає каталог моделей і діє як allowlist для `/model`.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додати записи до allowlist без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо не передати `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням масштабу зображень у стенограмах/інструментах (типово `1200`); менші значення зазвичай зменшують використання vision-токенів у запусках із великою кількістю скриншотів.
    - Див. [CLI моделей](/uk/concepts/models) для перемикання моделей у чаті та [Failover моделей](/uk/concepts/model-failover) для ротації auth і поведінки резервних моделей.
    - Для користувацьких/self-hosted provider див. [Користувацькі provider](/uk/gateway/configuration-reference#custom-providers-and-base-urls) у довідці.

  </Accordion>

  <Accordion title="Контролювати, хто може писати боту">
    Доступ до DM контролюється для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код pairing для підтвердження
    - `"allowlist"`: лише відправники з `allowFrom` (або зі сховища paired allow)
    - `"open"`: дозволити всі вхідні DM (потребує `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Див. [повну довідку](/uk/gateway/configuration-reference#dm-and-group-access) для деталей по кожному каналу.

  </Accordion>

  <Accordion title="Налаштувати фільтр згадок у групових чатах">
    Повідомлення в групах за замовчуванням **потребують згадки**. Налаштуйте шаблони для кожного агента:

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
    - Див. [повну довідку](/uk/gateway/configuration-reference#group-chat-mention-gating) для перевизначень на рівні каналу та режиму self-chat.

  </Accordion>

  <Accordion title="Обмежити Skills для кожного агента">
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
          { id: "docs", skills: ["docs-search"] }, // замінює значення за замовчуванням
          { id: "locked-down", skills: [] }, // без Skills
        ],
      },
    }
    ```

    - Не вказуйте `agents.defaults.skills`, щоб Skills за замовчуванням були необмеженими.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
    - Установіть `agents.list[].skills: []`, щоб не було Skills.
    - Див. [Skills](/uk/tools/skills), [Конфігурація Skills](/uk/tools/skills-config) і
      [Довідку з конфігурації](/uk/gateway/configuration-reference#agents-defaults-skills).

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

    - Установіть `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски health-monitor.
    - `channelStaleEventThresholdMinutes` має бути більшим або рівним інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного каналу чи облікового запису без вимкнення глобального монітора.
    - Див. [Перевірки стану](/uk/gateway/health) для робочого налагодження та [повну довідку](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштувати сесії та скидання">
    Сесії керують безперервністю розмови та ізоляцією:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // рекомендовано для кількох користувачів
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
    - `threadBindings`: глобальні значення за замовчуванням для маршрутизації сесій, прив’язаних до гілок (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сесіями](/uk/concepts/session) для області дії, identity links і політики надсилання.
    - Див. [повну довідку](/uk/gateway/configuration-reference#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнути sandboxing">
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

    Див. [Sandboxing](/uk/gateway/sandboxing) для повного посібника та [повну довідку](/uk/gateway/configuration-reference#agentsdefaultssandbox) для всіх параметрів.

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

    - Дозволяє gateway надсилати `push.test`, сигнали пробудження та пробудження для повторного підключення через зовнішній relay.
    - Використовує дозвіл на надсилання в межах реєстрації, який пересилає спарений застосунок iOS. Gateway не потребує relay-токена на рівні всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності gateway, з якою спарено застосунок iOS, тож інший gateway не зможе повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Надсилання через relay застосовуються лише до офіційно розповсюджуваних збірок, які зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації й надсилання доходив до того самого розгортання relay.

    Наскрізний потік:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спарте застосунок iOS із gateway і дочекайтеся підключення як сесії node, так і сесії оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує payload `push.apns.register` через relay до спареного gateway.
    5. Gateway зберігає relay handle і дозвіл на надсилання, а потім використовує їх для `push.test`, сигналів пробудження та пробуджень для повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, перепідключіть застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновлює свій кешований relay-запис реєстрації замість повторного використання старого relay-джерела.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається винятком для розробки лише для loopback; не зберігайте HTTP URL relay у конфігурації.

    Див. [Застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного потоку та [Потік автентифікації й довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

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
    - Див. [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

  </Accordion>

  <Accordion title="Налаштувати завдання Cron">
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

    - `sessionRetention`: очищати завершені ізольовані сесії запусків із `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: очищати `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Див. [Завдання Cron](/uk/automation/cron-jobs) для огляду функцій і прикладів CLI.

  </Accordion>

  <Accordion title="Налаштувати Webhook (hooks)">
    Увімкніть HTTP-ендпоїнти Webhook на Gateway:

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

    Примітка з безпеки:
    - Вважайте весь вміст payload hook/Webhook недовіреним введенням.
    - Використовуйте окремий `hooks.token`; не використовуйте повторно спільний токен Gateway.
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; тримайте вхідний трафік Webhook на окремому підшляху, наприклад `/hooks`.
    - Тримайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо тільки не виконуєте жорстко обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити вибрані викликачем ключі сесій.
    - Для агентів, що керуються hook, віддавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс sandboxing, де це можливо).

    Див. [повну довідку](/uk/gateway/configuration-reference#hooks) для всіх параметрів mapping і інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію Multi-Agent">
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

    Див. [Multi-Agent](/uk/concepts/multi-agent) і [повну довідку](/uk/gateway/configuration-reference#multi-agent-routing) для правил binding і профілів доступу для кожного агента.

  </Accordion>

  <Accordion title="Розділити конфігурацію на кілька файлів ($include)">
    Використовуйте `$include`, щоб організувати великі конфігурації:

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
    - **Масив файлів**: глибоко зливається по порядку (пізніше має пріоритет)
    - **Сусідні ключі**: зливаються після include (перевизначають включені значення)
    - **Вкладені include**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: розв’язуються відносно файла, який включає
    - **Записи, якими керує OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      підкріплений include одного файла, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний запис наскрізь**: кореневі include, масиви include та include
      із сусідніми перевизначеннями закрито завершуються помилкою для записів, якими керує OpenClaw, замість
      сплющування конфігурації
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок розбору й циклічних include

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway стежить за `~/.openclaw/openclaw.json` і автоматично застосовує зміни — для більшості параметрів ручний перезапуск не потрібен.

Прямі редагування файла вважаються недовіреними, доки не пройдуть валідацію. Спостерігач чекає,
поки завершиться тимчасовий запис/перейменування редактора, читає фінальний файл і відхиляє
недійсні зовнішні редагування, відновлюючи останню відому справну конфігурацію. Записи конфігурації,
якими керує OpenClaw, використовують той самий бар’єр схеми перед записом; руйнівні перезаписи, як-от
видалення `gateway.mode` або зменшення файла більш ніж наполовину, відхиляються
і зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите в журналах `Config auto-restored from last-known-good` або
`config reload restored last-known-good config`, перевірте відповідний
файл `.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім виконайте
`openclaw config validate`. Див. [Усунення проблем Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для контрольного списку відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво застосовує безпечні зміни без перезапуску. Для критичних автоматично перезапускає. |
| **`hot`**              | Застосовує безпечні зміни без перезапуску. Записує попередження, коли потрібен перезапуск — ви виконуєте його самі. |
| **`restart`**          | Перезапускає Gateway за будь-якої зміни конфігурації, безпечної чи ні.                   |
| **`off`**              | Вимикає спостереження за файлом. Зміни набувають чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується без перезапуску, а що потребує перезапуску

Більшість полів застосовуються без перезапуску й без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія          | Поля                                                              | Потрібен перезапуск? |
| ------------------ | ----------------------------------------------------------------- | -------------------- |
| Канали             | `channels.*`, `web` (WhatsApp) — усі вбудовані канали й канали plugin | Ні                   |
| Агент і моделі     | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація      | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сесії та повідомлення | `session`, `messages`                                          | Ні                   |
| Інструменти й медіа | `tools`, `browser`, `skills`, `audio`, `talk`                    | Ні                   |
| UI та інше         | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура     | `discovery`, `canvasHost`, `plugins`                              | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` — винятки: їхня зміна **не** спричиняє перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження на основі вихідного макета, а не сплющеного представлення в пам’яті.
Це зберігає передбачуваність рішень гарячого перезавантаження (застосування без перезапуску чи перезапуск) навіть коли
один розділ верхнього рівня живе у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Якщо вихідний макет неоднозначний, планування перезавантаження завершується помилкою за замовчуванням.

## Config RPC (програмні оновлення)

Для інструментів, які записують конфігурацію через API gateway, віддавайте перевагу такому потоку:

- `config.schema.lookup`, щоб перевірити одне піддерево (неглибокий вузол схеми + дочірні
  підсумки)
- `config.get`, щоб отримати поточний snapshot плюс `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти зливаються, `null`
  видаляє, масиви замінюються)
- `config.apply` лише тоді, коли ви справді хочете замінити всю конфігурацію
- `update.run` для явного самооновлення плюс перезапуску

<Note>
Записи control-plane (`config.apply`, `config.patch`, `update.run`)
обмежуються до 3 запитів на 60 секунд для кожної пари `deviceId+clientIp`. Запити на перезапуск
об’єднуються, а потім застосовують 30-секундне охолодження між циклами перезапуску.
</Note>

Приклад часткового patch:

```bash
openclaw gateway call config.get --params '{}'  # зберегти payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

`config.apply` і `config.patch` обидва приймають `raw`, `baseHash`, `sessionKey`,
`note` і `restartDelayMs`. `baseHash` є обов’язковим для обох методів, якщо
конфігурація вже існує.

## Змінні середовища

OpenClaw читає змінні середовища з батьківського процесу, а також із:

- `.env` з поточного робочого каталогу (якщо є)
- `~/.openclaw/.env` (глобальний резервний варіант)

Жоден із цих файлів не перевизначає наявні змінні середовища. Ви також можете задавати вбудовані env-змінні в конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт змінних середовища оболонки (необов’язково)">
  Якщо ввімкнено і очікувані ключі не задані, OpenClaw запускає вашу login shell і імпортує лише відсутні ключі:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Еквівалент env-змінної: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Підстановка env-змінних у значеннях конфігурації">
  Посилайтеся на env-змінні в будь-якому рядковому значенні конфігурації через `${VAR_NAME}`:

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

Докладно про SecretRef (зокрема `secrets.providers` для `env`/`file`/`exec`) див. у [Керуванні секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних наведено в [Поверхні облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Середовище](/uk/help/environment) для повної інформації про пріоритетність і джерела.

## Повна довідка

Щоб переглянути повну довідку по кожному полю, див. **[Довідку з конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язано: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідка з конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_
