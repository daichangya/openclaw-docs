---
read_when:
    - Налаштування OpenClaw уперше
    - Пошук типових шаблонів конфігурації
    - Навігація до певних розділів конфігурації
summary: 'Огляд конфігурації: типові завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-05T18:03:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: a39a7de09c5f9540785ec67f37d435a7a86201f0f5f640dae663054f35976712
    source_path: gateway/configuration.md
    workflow: 15
---

# Конфігурація

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.

Якщо файл відсутній, OpenClaw використовує безпечні типові значення. Типові причини додати конфігурацію:

- Підключити канали та визначити, хто може надсилати повідомлення боту
- Задати моделі, інструменти, sandboxing або автоматизацію (cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Усі доступні поля див. у [повному довіднику](/gateway/configuration-reference).

<Tip>
**Вперше працюєте з конфігурацією?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/gateway/configuration-examples) з готовими повними конфігураціями для копіювання.
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
    Control UI рендерить форму з live-схеми конфігурації, включно з метаданими документації полів
    `title` / `description`, а також схемами plugins і каналів, коли вони
    доступні, з редактором **Raw JSON** як запасним варіантом. Для UI з деталізацією
    та інших інструментів gateway також надає `config.schema.lookup`, щоб
    отримувати один вузол схеми, обмежений шляхом, і зведення для безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Редагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway стежить за файлом і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, які повністю відповідають схемі. Невідомі ключі, неправильні типи або недійсні значення змушують Gateway **відмовитися від запуску**. Єдиний виняток на кореневому рівні — `$schema` (string), щоб редактори могли підключати метадані JSON Schema.
</Warning>

Примітки щодо інструментів схем:

- `openclaw config schema` виводить ту саму сім’ю JSON Schema, яку використовують Control UI
  і валідація конфігурації.
- Значення полів `title` і `description` переносяться у вивід схеми для
  інструментів редакторів і форм.
- Вкладені об’єкти, wildcard-записи (`*`) і записи елементів масиву (`[]`) успадковують ті самі
  метадані документації, коли існує відповідна документація поля.
- Гілки композиції `anyOf` / `oneOf` / `allOf` також успадковують ті самі
  метадані документації, тому варіанти union/intersection зберігають ту саму довідку по полях.
- `config.schema.lookup` повертає один нормалізований шлях конфігурації з неглибоким
  вузлом схеми (`title`, `description`, `type`, `enum`, `const`, типові обмеження
  та подібні поля валідації), підібраними метаданими UI hints і зведеннями для безпосередніх дочірніх
  елементів для інструментів drill-down.
- Runtime-схеми plugins/каналів об’єднуються, коли gateway може завантажити
  поточний реєстр маніфестів.

Коли валідація не проходить:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Виконайте `openclaw doctor`, щоб побачити точні проблеми
- Виконайте `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

## Типові завдання

<AccordionGroup>
  <Accordion title="Налаштування каналу (WhatsApp, Telegram, Discord тощо)">
    Кожен канал має власний розділ конфігурації під `channels.<provider>`. Кроки налаштування див. на окремій сторінці каналу:

    - [WhatsApp](/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/channels/telegram) — `channels.telegram`
    - [Discord](/channels/discord) — `channels.discord`
    - [Feishu](/channels/feishu) — `channels.feishu`
    - [Google Chat](/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/channels/msteams) — `channels.msteams`
    - [Slack](/channels/slack) — `channels.slack`
    - [Signal](/channels/signal) — `channels.signal`
    - [iMessage](/channels/imessage) — `channels.imessage`
    - [Mattermost](/channels/mattermost) — `channels.mattermost`

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

    - `agents.defaults.models` визначає каталог моделей і слугує allowlist для `/model`.
    - Посилання на моделі використовують формат `provider/model` (наприклад `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує зменшенням розміру зображень у транскриптах/інструментах (типово `1200`); менші значення зазвичай зменшують використання vision-token у запусках з великою кількістю скриншотів.
    - Перемикання моделей у чаті див. у [Models CLI](/concepts/models), а ротацію auth і поведінку резервних варіантів — у [Model Failover](/concepts/model-failover).
    - Для кастомних/self-hosted провайдерів див. [Custom providers](/gateway/configuration-reference#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керування тим, хто може надсилати повідомлення боту">
    Доступ до DM керується для кожного каналу через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код pairing для схвалення
    - `"allowlist"`: лише відправники з `allowFrom` (або зі сховища paired allow)
    - `"open"`: дозволити всі вхідні DM (потрібно `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для каналу.

    Докладніше для кожного каналу див. у [повному довіднику](/gateway/configuration-reference#dm-and-group-access).

  </Accordion>

  <Accordion title="Налаштування gating згадувань у групових чатах">
    Для групових повідомлень типово **потрібне згадування**. Налаштуйте шаблони для кожного агента:

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

    - **Метадані згадувань**: нативні @-згадування (WhatsApp tap-to-mention, Telegram @bot тощо)
    - **Текстові шаблони**: безпечні regex-шаблони в `mentionPatterns`
    - Перевизначення для окремих каналів і режим self-chat див. у [повному довіднику](/gateway/configuration-reference#group-chat-mention-gating).

  </Accordion>

  <Accordion title="Обмеження Skills для окремого агента">
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

    - Не задавайте `agents.defaults.skills`, щоб типово мати необмежені Skills.
    - Не задавайте `agents.list[].skills`, щоб успадковувати типові значення.
    - Задайте `agents.list[].skills: []`, щоб не мати Skills.
    - Див. [Skills](/tools/skills), [Skills config](/tools/skills-config) і
      [Довідник конфігурації](/gateway/configuration-reference#agentsdefaultsskills).

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

    - Задайте `gateway.channelHealthCheckMinutes: 0`, щоб глобально вимкнути перезапуски за health-monitor.
    - `channelStaleEventThresholdMinutes` має бути більшим або рівним інтервалу перевірки.
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного каналу або облікового запису без вимкнення глобального монітора.
    - Для операційного налагодження див. [Health Checks](/gateway/health), а всі поля — у [повному довіднику](/gateway/configuration-reference#gateway).

  </Accordion>

  <Accordion title="Налаштування сесій і скидань">
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

    - `dmScope`: `main` (shared) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: глобальні типові значення для маршрутизації сесій, прив’язаних до thread (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Про області видимості, зв’язки ідентичності та політику надсилання див. [Керування сесіями](/concepts/session).
    - Усі поля див. в [повному довіднику](/gateway/configuration-reference#session).

  </Accordion>

  <Accordion title="Увімкнення sandboxing">
    Запускайте сесії агентів в ізольованих Docker-контейнерах:

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

    Повний посібник див. у [Sandboxing](/gateway/sandboxing), а всі параметри — у [повному довіднику](/gateway/configuration-reference#agentsdefaultssandbox).

  </Accordion>

  <Accordion title="Увімкнення push через relay для офіційних збірок iOS">
    Push через relay налаштовується в `openclaw.json`.

    Задайте це в конфігурації gateway:

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

    Що це дає:

    - Дає gateway змогу надсилати `push.test`, wake-поштовхи та reconnect wakes через зовнішній relay.
    - Використовує грант надсилання в межах реєстрації, який пересилає спарений застосунок iOS. Gateway не потрібен relay-token для всього розгортання.
    - Прив’язує кожну реєстрацію через relay до ідентичності gateway, з якою спарився застосунок iOS, тому інший gateway не може повторно використати збережену реєстрацію.
    - Залишає локальні/ручні збірки iOS на прямих APNs. Надсилання через relay застосовується лише до офіційних поширених збірок, які зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання потрапляв на той самий розгорнутий relay.

    End-to-end потік:

    1. Встановіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спаріть застосунок iOS із gateway і дочекайтеся підключення сесій node та operator.
    4. Застосунок iOS отримує ідентичність gateway, реєструється в relay через App Attest і app receipt, а потім публікує relay-backed payload `push.apns.register` у спарений gateway.
    5. Gateway зберігає relay handle і send grant, а потім використовує їх для `push.test`, wake-поштовхів і reconnect wakes.

    Операційні примітки:

    - Якщо ви переключите застосунок iOS на інший gateway, перепідключіть застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього gateway.
    - Якщо ви випустите нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновить кешовану relay-реєстрацію замість повторного використання старого relay origin.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` і далі працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` залишається loopback-only аварійним варіантом для dev; не зберігайте HTTP relay URL у конфігурації.

    End-to-end потік див. у [iOS App](/platforms/ios#relay-backed-push-for-official-builds), а модель безпеки relay — у [Потік автентифікації та довіри](/platforms/ios#authentication-and-trust-flow).

  </Accordion>

  <Accordion title="Налаштування heartbeat (періодичних check-in)">
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

    - `every`: рядок тривалості (`30m`, `2h`). Задайте `0m`, щоб вимкнути.
    - `target`: `last` | `none` | `<channel-id>` (наприклад `discord`, `matrix`, `telegram` або `whatsapp`)
    - `directPolicy`: `allow` (типово) або `block` для heartbeat-цілей у стилі DM
    - Повний посібник див. у [Heartbeat](/gateway/heartbeat).

  </Accordion>

  <Accordion title="Налаштування cron jobs">
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

    - `sessionRetention`: очищення завершених ізольованих сесій запусків із `sessions.json` (типово `24h`; задайте `false`, щоб вимкнути).
    - `runLog`: очищення `cron/runs/<jobId>.jsonl` за розміром і кількістю збережених рядків.
    - Огляд функцій і приклади CLI див. у [Cron jobs](/automation/cron-jobs).

  </Accordion>

  <Accordion title="Налаштування вебхуків (hooks)">
    Увімкніть HTTP webhook-ендпоїнти на Gateway:

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
    - Вважайте весь вміст payload hooks/webhooks недовіреним входом.
    - Використовуйте окремий `hooks.token`; не використовуйте спільний токен Gateway повторно.
    - Автентифікація hooks працює лише через заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в query string відхиляються.
    - `hooks.path` не може бути `/`; використовуйте для webhook ingress окремий підшлях, наприклад `/hooks`.
    - Тримайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузькоспрямоване налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити session key, які може вибирати викликач.
    - Для агентів, керованих через hooks, віддавайте перевагу сильним сучасним model tiers і суворій політиці інструментів (наприклад лише обмін повідомленнями плюс sandboxing, де це можливо).

    Усі параметри mappings і інтеграцію з Gmail див. у [повному довіднику](/gateway/configuration-reference#hooks).

  </Accordion>

  <Accordion title="Налаштування маршрутизації з кількома агентами">
    Запускайте кілька ізольованих агентів з окремими workspace і session:

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

    Правила bindings і профілі доступу для окремих агентів див. у [Multi-Agent](/concepts/multi-agent) і [повному довіднику](/gateway/configuration-reference#multi-agent-routing).

  </Accordion>

  <Accordion title="Розділення конфігурації на кілька файлів ($include)">
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

    - **Один файл**: замінює об’єкт, у якому міститься
    - **Масив файлів**: deep-merge у заданому порядку (пізніший перемагає)
    - **Сусідні ключі**: об’єднуються після includes (перевизначають включені значення)
    - **Вкладені includes**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: визначаються відносно файлу, що включає
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок парсингу та циклічних include

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway стежить за `~/.openclaw/openclaw.json` і автоматично застосовує зміни — для більшості налаштувань ручний перезапуск не потрібен.

### Режими перезавантаження

| Режим                  | Поведінка                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво гаряче застосовує безпечні зміни. Для критичних автоматично перезапускається. |
| **`hot`**              | Гаряче застосовує лише безпечні зміни. Коли потрібен перезапуск, пише попередження — ви обробляєте це самі. |
| **`restart`**          | Перезапускає Gateway при будь-якій зміні конфігурації, безпечній чи ні.                |
| **`off`**              | Вимикає стеження за файлом. Зміни набирають чинності після наступного ручного перезапуску. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Що застосовується гаряче, а що потребує перезапуску

Більшість полів застосовуються гаряче без простою. У режимі `hybrid` зміни, які вимагають перезапуску, обробляються автоматично.

| Категорія             | Поля                                                                 | Потрібен перезапуск? |
| --------------------- | -------------------------------------------------------------------- | -------------------- |
| Канали                | `channels.*`, `web` (WhatsApp) — усі вбудовані канали та канали extensions | Ні               |
| Агенти й моделі       | `agent`, `agents`, `models`, `routing`                               | Ні                   |
| Автоматизація         | `hooks`, `cron`, `agent.heartbeat`                                   | Ні                   |
| Сесії та повідомлення | `session`, `messages`                                                | Ні                   |
| Інструменти та медіа  | `tools`, `browser`, `skills`, `audio`, `talk`                        | Ні                   |
| UI та інше            | `ui`, `logging`, `identity`, `bindings`                              | Ні                   |
| Сервер Gateway        | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Так**              |
| Інфраструктура        | `discovery`, `canvasHost`, `plugins`                                 | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` — винятки: їхня зміна **не** викликає перезапуск.
</Note>

## RPC конфігурації (програмні оновлення)

<Note>
RPC керуючої площини для запису (`config.apply`, `config.patch`, `update.run`) мають rate limit **3 запити за 60 секунд** для кожного `deviceId+clientIp`. При спрацюванні ліміту RPC повертає `UNAVAILABLE` з `retryAfterMs`.
</Note>

Безпечний/типовий потік:

- `config.schema.lookup`: перевірити одне піддерево конфігурації, обмежене шляхом, з неглибоким
  вузлом схеми, підібраними метаданими hints і зведеннями безпосередніх дочірніх елементів
- `config.get`: отримати поточний snapshot + hash
- `config.patch`: бажаний шлях часткового оновлення
- `config.apply`: лише повна заміна конфігурації
- `update.run`: явне self-update + restart

Коли ви не замінюєте всю конфігурацію, віддавайте перевагу `config.schema.lookup`,
а потім `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (повна заміна)">
    Перевіряє + записує повну конфігурацію та перезапускає Gateway одним кроком.

    <Warning>
    `config.apply` замінює **всю конфігурацію**. Для часткових оновлень використовуйте `config.patch`, а для окремих ключів — `openclaw config set`.
    </Warning>

    Параметри:

    - `raw` (string) — JSON5 payload для всієї конфігурації
    - `baseHash` (необов’язково) — hash конфігурації з `config.get` (обов’язково, коли конфігурація існує)
    - `sessionKey` (необов’язково) — ключ сесії для ping після перезапуску
    - `note` (необов’язково) — примітка для restart sentinel
    - `restartDelayMs` (необов’язково) — затримка перед перезапуском (типово 2000)

    Запити на перезапуск об’єднуються, якщо один уже очікує/виконується, і між циклами перезапуску діє затримка 30 секунд.

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
    - `baseHash` (обов’язково) — hash конфігурації з `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — ті самі, що в `config.apply`

    Поведінка перезапуску така сама, як у `config.apply`: об’єднання очікуваних перезапусків плюс затримка 30 секунд між циклами перезапуску.

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

- `.env` у поточній робочій теці (якщо існує)
- `~/.openclaw/.env` (глобальне резервне значення)

Жоден із цих файлів не перевизначає вже наявні env vars. Ви також можете задавати вбудовані env vars у конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт shell env (необов’язково)">
  Якщо ввімкнено і очікувані ключі не задано, OpenClaw запускає ваш login shell і імпортує лише відсутні ключі:

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
  Посилайтеся на env vars у будь-якому string-значенні конфігурації через `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Правила:

- Зіставляються лише назви у верхньому регістрі: `[A-Z_][A-Z0-9_]*`
- Відсутні/порожні vars викликають помилку під час завантаження
- Екрануйте через `$${VAR}` для буквального виводу
- Працює всередині файлів `$include`
- Вбудована підстановка: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
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

Докладно про SecretRef (включно з `secrets.providers` для `env`/`file`/`exec`) див. у [Керування секретами](/gateway/secrets).
Підтримувані шляхи облікових даних перелічено в [Поверхня облікових даних SecretRef](/reference/secretref-credential-surface).
</Accordion>

Повний порядок пріоритетів і джерела див. у [Environment](/help/environment).

## Повний довідник

Повний довідник по полях див. у **[Довідник конфігурації](/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/gateway/configuration-examples) · [Довідник конфігурації](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
