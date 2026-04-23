---
read_when:
    - Перше налаштування OpenClaw
    - Пошук поширених шаблонів конфігурації
    - Перехід до певних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-23T19:24:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e21161b8b05cf2963d935646bc9b8fe3e3de514cefee71c837566a4090538df2
    source_path: gateway/configuration.md
    workflow: 15
---

# Конфігурація

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 підтримує коментарі та кінцеві коми">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Схеми з
символічним посиланням `openclaw.json` не підтримуються для записів, якими
керує OpenClaw; атомарний запис може замінити шлях замість збереження
символічного посилання. Якщо ви зберігаєте конфігурацію поза типовим каталогом
стану, вкажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні типові значення. Поширені причини додати конфігурацію:

- Підключити канали та визначити, хто може надсилати повідомлення боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Перегляньте [повний довідник](/uk/gateway/configuration-reference), щоб побачити всі доступні поля.

<Tip>
**Ви новачок у конфігурації?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) для повних конфігурацій, які можна скопіювати й вставити.
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
    Control UI відображає форму з актуальної схеми конфігурації, включно з
    метаданими документації полів `title` / `description`, а також схемами Plugin і каналів,
    коли вони доступні, із редактором **Raw JSON** як запасним варіантом. Для деталізованих
    UI та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми з областю видимості шляху та зведення його
    безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Редагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway відстежує файл і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, некоректні типи або недійсні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли приєднувати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують Control UI
і валідація. `config.schema.lookup` отримує один вузол із областю видимості шляху та
зведення дочірніх елементів для інструментів деталізації. Метадані документації полів
`title`/`description` поширюються через вкладені об’єкти, гілки з підстановкою (`*`),
елементами масиву (`[]`) та `anyOf`/`oneOf`/`allOf`.
Схеми Plugin і каналів під час виконання об’єднуються, коли завантажується
реєстр маніфестів.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Запустіть `openclaw doctor`, щоб побачити точні проблеми
- Запустіть `openclaw doctor --fix` (або `--yes`) для застосування виправлень

Gateway зберігає довірену останню відому коректну копію після кожного успішного запуску.
Якщо `openclaw.json` пізніше не проходить валідацію (або втрачає `gateway.mode`, різко
зменшується чи має випадковий рядок журналу на початку), OpenClaw зберігає
пошкоджений файл як `.clobbered.*`, відновлює останню відому коректну копію та
записує причину відновлення в журнал. Наступний хід агента також отримує
попередження про системну подію, щоб основний агент не перезаписав сліпо
відновлену конфігурацію. Підвищення до останньої відомої коректної копії
пропускається, якщо кандидат містить замасковані заповнювачі секретів, як-от `***`.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Налаштувати канал (WhatsApp, Telegram, Discord тощо)">
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

    Усі канали мають спільний шаблон політики DM:

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
    Встановіть основну модель і необов’язкові резервні:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.5"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.5": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` визначає каталог моделей і діє як allowlist для `/model`.
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи до allowlist без видалення наявних моделей. Звичайні заміни, які видалили б записи, відхиляються, якщо ви не передасте `--replace`.
    - refs моделей використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням масштабу зображень у транскрипті/інструментах (типове значення `1200`); менші значення зазвичай зменшують використання vision-token у запусках із великою кількістю знімків екрана.
    - Дивіться [Models CLI](/uk/concepts/models) для перемикання моделей у чаті та [Model Failover](/uk/concepts/model-failover) для ротації автентифікації та поведінки резервного переходу.
    - Для користувацьких/self-hosted провайдерів дивіться [користувацькі провайдери](/uk/gateway/configuration-reference#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може писати боту">
    Доступ до DM керується окремо для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код сполучення для схвалення
    - `"allowlist"`: лише відправники з `allowFrom` (або зі сховища paired allow)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Дивіться [повний довідник](/uk/gateway/configuration-reference#dm-and-group-access), щоб дізнатися подробиці для кожного каналу.

  </Accordion>

  <Accordion title="Налаштувати обмеження згадок у груповому чаті">
    Для групових повідомлень типово **потрібна згадка**. Налаштуйте шаблони для кожного агента:

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
    - Дивіться [повний довідник](/uk/gateway/configuration-reference#group-chat-mention-gating), щоб дізнатися про перевизначення для кожного каналу та режим self-chat.

  </Accordion>

  <Accordion title="Обмежити Skills для кожного агента">
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

    - Не вказуйте `agents.defaults.skills`, щоб Skills типово не мали обмежень.
    - Не вказуйте `agents.list[].skills`, щоб успадкувати типові значення.
    - Встановіть `agents.list[].skills: []`, щоб не було Skills.
    - Дивіться [Skills](/uk/tools/skills), [конфігурація Skills](/uk/tools/skills-config) та
      [довідник з конфігурації](/uk/gateway/configuration-reference#agents-defaults-skills).

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

    - Встановіть `gateway.channelHealthCheckMinutes: 0`, щоб вимкнути перезапуски монітора стану глобально.
    - `channelStaleEventThresholdMinutes` має бути більшим або рівним інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного каналу або облікового запису без вимкнення глобального монітора.
    - Дивіться [Health Checks](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштувати сесії та скидання">
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

    - `dmScope`: `main` (спільний) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: глобальні типові значення для маршрутизації сесій, прив’язаних до тредів (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Дивіться [Session Management](/uk/concepts/session) для областей видимості, зв’язків ідентичностей і політики надсилання.
    - Дивіться [повний довідник](/uk/gateway/configuration-reference#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнути ізоляцію">
    Запускайте сесії агента в ізольованих runtime-середовищах:

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

    Дивіться [Sandboxing](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/configuration-reference#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнути push через relay для офіційних збірок iOS">
    Push через relay налаштовується в `openclaw.json`.

    Встановіть це в конфігурації gateway:

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

    Еквівалент CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Що це робить:

    - Дозволяє gateway надсилати `push.test`, сигнали пробудження та сигнали повторного підключення через зовнішній relay.
    - Використовує право надсилання в межах реєстрації, яке пересилає сполучений застосунок iOS. Gateway не потребує relay-токена для всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності gateway, з якою було сполучено застосунок iOS, щоб інший gateway не міг повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямому APNs. Надсилання через relay застосовується лише до офіційно поширюваних збірок, які зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight-збірку iOS, щоб трафік реєстрації й надсилання потрапляв до того самого розгортання relay.

    Наскрізний потік:

    1. Установіть офіційну/TestFlight-збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Сполучіть застосунок iOS із gateway і дайте підключитися як сеансам node, так і сеансам оператора.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує payload `push.apns.register` через relay до сполученого gateway.
    5. Gateway зберігає relay handle і право надсилання, а потім використовує їх для `push.test`, сигналів пробудження та сигналів повторного підключення.

    Операційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, повторно підключіть застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновлює свою кешовану relay-реєстрацію замість повторного використання старого relay origin.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається виключно loopback-орієнтованим аварійним механізмом для розробки; не зберігайте HTTP URL relay у конфігурації.

    Дивіться [iOS App](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного потоку та [Authentication and trust flow](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

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
    - `directPolicy`: `allow` (типово) або `block` для цілей Heartbeat у стилі DM
    - Дивіться [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

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

    - `sessionRetention`: очищати завершені ізольовані сеанси запуску з `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: очищати `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Дивіться [завдання Cron](/uk/automation/cron-jobs) для огляду функціональності та прикладів CLI.

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

    Примітка щодо безпеки:
    - Розглядайте весь вміст payload hook/Webhook як недовірене введення.
    - Використовуйте окремий `hooks.token`; не використовуйте спільний токен Gateway повторно.
    - Автентифікація hook працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в рядку запиту відхиляються.
    - `hooks.path` не може бути `/`; тримайте вхідний трафік Webhook на окремому підшляху, наприклад `/hooks`.
    - Залишайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо тільки не виконуєте суворо обмежене налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також установіть `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сеансу, які вибирає викликач.
    - Для агентів, керованих hook, віддавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс ізоляція, де це можливо).

    Дивіться [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів mapping і інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію з кількома агентами">
    Запускайте кілька ізольованих агентів з окремими workspace і сеансами:

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

    Дивіться [Multi-Agent](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/configuration-reference#multi-agent-routing) для правил binding і профілів доступу для кожного агента.

  </Accordion>

  <Accordion title="Розділити конфігурацію на кілька файлів ($include)">
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

    - **Один файл**: замінює об’єкт-контейнер
    - **Масив файлів**: глибоко об’єднується за порядком (пізніший має пріоритет)
    - **Сусідні ключі**: об’єднуються після include (перевизначають включені значення)
    - **Вкладені include**: підтримуються до 10 рівнів глибини
    - **Відносні шляхи**: обчислюються відносно файла, який включає
    - **Записи, якими керує OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      що підтримується include одного файла, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` недоторканим
    - **Непідтримуваний наскрізний запис**: кореневі include, масиви include та include
      із сусідніми перевизначеннями аварійно завершуються для записів, якими керує OpenClaw, замість
      сплющення конфігурації
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок парсингу та циклічних include

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway відстежує `~/.openclaw/openclaw.json` і автоматично застосовує зміни — для більшості параметрів ручний перезапуск не потрібен.

Прямі редагування файлу вважаються недовіреними, доки не пройдуть валідацію. Спостерігач
чекає, поки тимчасові записи/перейменування редактора стабілізуються, читає
підсумковий файл і відхиляє недійсні зовнішні редагування, відновлюючи
останню відому коректну конфігурацію. Записи конфігурації, якими керує OpenClaw,
використовують той самий контроль схеми перед записом; руйнівні затирання, такі
як видалення `gateway.mode` або зменшення файлу більш ніж наполовину, відхиляються
й зберігаються як `.rejected.*` для перевірки.

Якщо в журналах ви бачите `Config auto-restored from last-known-good` або
`config reload restored last-known-good config`, перевірте відповідний файл
`.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім
запустіть `openclaw config validate`. Дивіться [усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для контрольного списку відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                                |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Автоматично перезапускає для критичних.       |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Записує попередження, коли потрібен перезапуск — ви обробляєте це самі. |
| **`restart`**          | Перезапускає Gateway після будь-якої зміни конфігурації, безпечної чи ні.               |
| **`off`**              | Вимикає відстеження файлів. Зміни набувають чинності під час наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гаряче, а що потребує перезапуску

Більшість полів застосовуються гаряче без простою. У режимі `hybrid` зміни, що потребують перезапуску, обробляються автоматично.

| Категорія            | Поля                                                              | Потрібен перезапуск? |
| -------------------- | ----------------------------------------------------------------- | -------------------- |
| Канали               | `channels.*`, `web` (WhatsApp) — усі вбудовані канали та канали Plugin | Ні                   |
| Агент і моделі       | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Автоматизація        | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Сеанси та повідомлення | `session`, `messages`                                           | Ні                   |
| Інструменти й медіа  | `tools`, `browser`, `skills`, `audio`, `talk`                     | Ні                   |
| UI та інше           | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Сервер Gateway       | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Інфраструктура       | `discovery`, `canvasHost`, `plugins`                              | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` є винятками — їх зміна **не** спричиняє перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження на основі авторського макета джерела, а не сплющеного подання в пам’яті.
Це робить рішення гарячого перезавантаження (гаряче застосування чи перезапуск) передбачуваними, навіть коли
один розділ верхнього рівня живе у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження аварійно завершується,
якщо макет джерела неоднозначний.

## Config RPC (програмні оновлення)

Для інструментів, які записують конфігурацію через API gateway, віддавайте перевагу такому потоку:

- `config.schema.lookup`, щоб перевірити одне піддерево (неглибокий вузол схеми + зведення дочірніх елементів)
- `config.get`, щоб отримати поточний snapshot і `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти об’єднуються, `null`
  видаляє, масиви замінюються)
- `config.apply` лише тоді, коли ви маєте намір замінити всю конфігурацію
- `update.run` для явного самостійного оновлення та перезапуску

<Note>
Записи control-plane (`config.apply`, `config.patch`, `update.run`) мають
обмеження частоти: 3 запити на 60 секунд для кожного `deviceId+clientIp`. Запити
на перезапуск об’єднуються, а потім застосовують 30-секундний cooldown між циклами перезапуску.
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
`note` і `restartDelayMs`. `baseHash` є обов’язковим для обох методів, якщо
конфігурація вже існує.

## Змінні середовища

OpenClaw читає env vars із батьківського процесу, а також із:

- `.env` у поточному робочому каталозі (якщо присутній)
- `~/.openclaw/.env` (глобальний резервний варіант)

Жоден із цих файлів не перевизначає вже наявні env vars. Ви також можете задавати inline env vars у конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт shell env (необов’язково)">
  Якщо його ввімкнено, а очікувані ключі не задано, OpenClaw запускає вашу shell входу та імпортує лише відсутні ключі:

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
  Посилайтеся на env vars у будь-якому рядковому значенні конфігурації за допомогою `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Правила:

- Зіставляються лише імена у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні/порожні vars спричиняють помилку під час завантаження
- Екрануйте через `$${VAR}` для буквального виводу
- Працює у файлах `$include`
- Inline-підстановка: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Посилання на секрети (env, file, exec)">
  Для полів, які підтримують об’єкти SecretRef, ви можете використовувати:

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

Подробиці SecretRef (включно з `secrets.providers` для `env`/`file`/`exec`) наведено в [Керування секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Дивіться [Environment](/uk/help/environment) для повного опису пріоритетів і джерел.

## Повний довідник

Повний довідник по полях дивіться в **[Configuration Reference](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник з конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_
