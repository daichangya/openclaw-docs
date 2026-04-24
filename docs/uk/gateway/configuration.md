---
read_when:
    - Перше налаштування OpenClaw
    - Шукаєте поширені шаблони конфігурації
    - Перехід до конкретних розділів конфігурації
summary: 'Огляд конфігурації: поширені завдання, швидке налаштування та посилання на повний довідник'
title: Конфігурація
x-i18n:
    generated_at: "2026-04-24T03:44:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a47a2c02c37b012a8d8222d3f160634343090b633be722393bac2ebd6adc91c
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw читає необов’язкову конфігурацію <Tooltip tip="JSON5 підтримує коментарі та кінцеві коми">**JSON5**</Tooltip> з `~/.openclaw/openclaw.json`.
Активний шлях конфігурації має бути звичайним файлом. Макети `openclaw.json`
із symlink не підтримуються для записів, якими керує OpenClaw; атомарний запис може замінити
цей шлях замість збереження symlink. Якщо ви зберігаєте конфігурацію поза
каталогом стану за замовчуванням, вкажіть `OPENCLAW_CONFIG_PATH` безпосередньо на реальний файл.

Якщо файл відсутній, OpenClaw використовує безпечні значення за замовчуванням. Поширені причини додати конфігурацію:

- Підключити channels і керувати тим, хто може писати боту
- Налаштувати моделі, інструменти, ізоляцію або автоматизацію (cron, hooks)
- Налаштувати сесії, медіа, мережу або UI

Див. [повний довідник](/uk/gateway/configuration-reference) для всіх доступних полів.

<Tip>
**Новачок у налаштуванні конфігурації?** Почніть з `openclaw onboard` для інтерактивного налаштування або перегляньте посібник [Приклади конфігурації](/uk/gateway/configuration-examples) для повних конфігурацій, які можна просто скопіювати й вставити.
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
    Control UI рендерить форму з актуальної схеми конфігурації, включно з метаданими документації
    полів `title` / `description`, а також схемами Plugin і channel, коли вони
    доступні, з редактором **Raw JSON** як запасним варіантом. Для UI з деталізацією
    та інших інструментів Gateway також надає `config.schema.lookup`, щоб
    отримати один вузол схеми з областю шляху разом із підсумками безпосередніх дочірніх елементів.
  </Tab>
  <Tab title="Пряме редагування">
    Відредагуйте `~/.openclaw/openclaw.json` безпосередньо. Gateway стежить за файлом і автоматично застосовує зміни (див. [гаряче перезавантаження](#config-hot-reload)).
  </Tab>
</Tabs>

## Сувора валідація

<Warning>
OpenClaw приймає лише конфігурації, що повністю відповідають схемі. Невідомі ключі, неправильні типи або недійсні значення призводять до того, що Gateway **відмовляється запускатися**. Єдиний виняток на кореневому рівні — `$schema` (рядок), щоб редактори могли підключати метадані JSON Schema.
</Warning>

`openclaw config schema` виводить канонічну JSON Schema, яку використовують Control UI
і валідація. `config.schema.lookup` отримує один вузол із областю шляху разом із
підсумками дочірніх елементів для інструментів деталізації. Метадані документації полів `title`/`description`
передаються через вкладені об’єкти, wildcard (`*`), елементи масиву (`[]`) і гілки `anyOf`/
`oneOf`/`allOf`. Схеми runtime Plugin і channel об’єднуються, коли
завантажено реєстр маніфестів.

Коли валідація завершується помилкою:

- Gateway не запускається
- Працюють лише діагностичні команди (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Виконайте `openclaw doctor`, щоб побачити точні проблеми
- Виконайте `openclaw doctor --fix` (або `--yes`), щоб застосувати виправлення

Gateway зберігає довірену останню коректну копію після кожного успішного запуску.
Якщо `openclaw.json` пізніше не проходить валідацію (або втрачає `gateway.mode`, різко
зменшується, або на початку з’являється зайвий рядок журналу), OpenClaw зберігає пошкоджений файл
як `.clobbered.*`, відновлює останню коректну копію та записує причину
відновлення в журнал. Наступний хід агента також отримує системне попередження, щоб основний
агент не переписав відновлену конфігурацію всліпу. Підвищення до статусу останньої коректної копії
пропускається, якщо кандидат містить замасковані плейсхолдери секретів, такі як `***`.

## Поширені завдання

<AccordionGroup>
  <Accordion title="Налаштувати channel (WhatsApp, Telegram, Discord тощо)">
    Кожен channel має власний розділ конфігурації в `channels.<provider>`. Див. окрему сторінку channel для кроків налаштування:

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

    Усі channels використовують однаковий шаблон політики DM:

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
    Задайте основну модель і необов’язкові запасні:

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
    - Використовуйте `openclaw config set agents.defaults.models '<json>' --strict-json --merge`, щоб додавати записи в allowlist без видалення наявних моделей. Звичайні заміни, які видаляють записи, відхиляються, якщо ви не передасте `--replace`.
    - Посилання на моделі використовують формат `provider/model` (наприклад, `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` керує масштабуванням зображень у transcript/tool (типово `1200`); менші значення зазвичай зменшують використання vision-token у сценаріях з великою кількістю скріншотів.
    - Див. [Models CLI](/uk/concepts/models) для перемикання моделей у чаті та [Model Failover](/uk/concepts/model-failover) для ротації автентифікації й поведінки запасних варіантів.
    - Для користувацьких/self-hosted провайдерів див. [Користувацькі провайдери](/uk/gateway/config-tools#custom-providers-and-base-urls) у довіднику.

  </Accordion>

  <Accordion title="Керувати тим, хто може писати боту">
    Доступ до DM керується для кожного channel через `dmPolicy`:

    - `"pairing"` (типово): невідомі відправники отримують одноразовий код pairing для схвалення
    - `"allowlist"`: лише відправники з `allowFrom` (або сховища paired allow)
    - `"open"`: дозволити всі вхідні DM (потребує `allowFrom: ["*"]`)
    - `"disabled"`: ігнорувати всі DM

    Для груп використовуйте `groupPolicy` + `groupAllowFrom` або allowlist, специфічні для channel.

    Див. [повний довідник](/uk/gateway/config-channels#dm-and-group-access) для деталей по кожному channel.

  </Accordion>

  <Accordion title="Налаштувати gating згадок у груповому чаті">
    Для групових повідомлень типово **потрібна згадка**. Налаштовуйте шаблони для кожного агента:

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
    - Див. [повний довідник](/uk/gateway/config-channels#group-chat-mention-gating) для перевизначень по channel і режиму self-chat.

  </Accordion>

  <Accordion title="Обмежити Skills для кожного агента">
    Використовуйте `agents.defaults.skills` для спільної базової конфігурації, а потім перевизначайте
    конкретних агентів через `agents.list[].skills`:

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

    - Не задавайте `agents.defaults.skills`, щоб Skills за замовчуванням були необмеженими.
    - Не задавайте `agents.list[].skills`, щоб успадкувати значення за замовчуванням.
    - Задайте `agents.list[].skills: []`, щоб не було Skills.
    - Див. [Skills](/uk/tools/skills), [конфігурацію Skills](/uk/tools/skills-config) і
      [Довідник із конфігурації](/uk/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Налаштувати моніторинг стану channels Gateway">
    Керуйте тим, наскільки агресивно gateway перезапускає channels, які виглядають застарілими:

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
    - Використовуйте `channels.<provider>.healthMonitor.enabled` або `channels.<provider>.accounts.<id>.healthMonitor.enabled`, щоб вимкнути автоперезапуски для одного channel або облікового запису без вимкнення глобального монітора.
    - Див. [Health Checks](/uk/gateway/health) для операційного налагодження та [повний довідник](/uk/gateway/configuration-reference#gateway) для всіх полів.

  </Accordion>

  <Accordion title="Налаштувати сесії та скидання">
    Сесії керують безперервністю й ізоляцією розмов:

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
    - `threadBindings`: глобальні значення за замовчуванням для маршрутизації сесій, прив’язаних до тредів (Discord підтримує `/focus`, `/unfocus`, `/agents`, `/session idle` і `/session max-age`).
    - Див. [Керування сесіями](/uk/concepts/session) для областей дії, зв’язків identity і політики надсилання.
    - Див. [повний довідник](/uk/gateway/config-agents#session) для всіх полів.

  </Accordion>

  <Accordion title="Увімкнути ізоляцію">
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

    Див. [Ізоляція](/uk/gateway/sandboxing) для повного посібника та [повний довідник](/uk/gateway/config-agents#agentsdefaultssandbox) для всіх параметрів.

  </Accordion>

  <Accordion title="Увімкнути relay-backed push для офіційних збірок iOS">
    Relay-backed push налаштовується в `openclaw.json`.

    Задайте це в конфігурації gateway:

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

    Еквівалент через CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Що це робить:

    - Дозволяє gateway надсилати `push.test`, сигнали пробудження й reconnect-wake через зовнішній relay.
    - Використовує grant на надсилання в межах реєстрації, який пересилає спарений застосунок iOS. Gateway не потребує relay-токена масштабу всього розгортання.
    - Прив’язує кожну relay-backed реєстрацію до identity gateway, з якою було спарено застосунок iOS, тож інший gateway не може повторно використати збережену реєстрацію.
    - Зберігає локальні/ручні збірки iOS на прямому APNs. Relay-backed надсилання застосовуються лише до офіційно розповсюджуваних збірок, які зареєструвалися через relay.
    - Має збігатися з базовим URL relay, вбудованим в офіційну/TestFlight збірку iOS, щоб трафік реєстрації та надсилання досягав того самого розгортання relay.

    Наскрізний процес:

    1. Установіть офіційну/TestFlight збірку iOS, скомпільовану з тим самим базовим URL relay.
    2. Налаштуйте `gateway.push.apns.relay.baseUrl` на gateway.
    3. Спарте застосунок iOS із gateway і дайте підключитися сесіям node та оператора.
    4. Застосунок iOS отримує identity gateway, реєструється в relay за допомогою App Attest і квитанції застосунку, а потім публікує relay-backed payload `push.apns.register` до спареного gateway.
    5. Gateway зберігає relay handle і send grant, а потім використовує їх для `push.test`, сигналів пробудження й reconnect-wake.

    Експлуатаційні примітки:

    - Якщо ви перемикаєте застосунок iOS на інший gateway, перепідключіть застосунок, щоб він міг опублікувати нову relay-реєстрацію, прив’язану до цього gateway.
    - Якщо ви випускаєте нову збірку iOS, яка вказує на інше розгортання relay, застосунок оновлює свій кешований relay-registration замість повторного використання старого relay origin.

    Примітка щодо сумісності:

    - `OPENCLAW_APNS_RELAY_BASE_URL` і `OPENCLAW_APNS_RELAY_TIMEOUT_MS` усе ще працюють як тимчасові перевизначення через env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` лишається запасним варіантом для розробки лише на loopback; не зберігайте URL relay з HTTP у конфігурації.

    Див. [Застосунок iOS](/uk/platforms/ios#relay-backed-push-for-official-builds) для наскрізного процесу та [Процес автентифікації та довіри](/uk/platforms/ios#authentication-and-trust-flow) для моделі безпеки relay.

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
    - Див. [Heartbeat](/uk/gateway/heartbeat) для повного посібника.

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

    - `sessionRetention`: очищати завершені ізольовані сесії запусків із `sessions.json` (типово `24h`; установіть `false`, щоб вимкнути).
    - `runLog`: очищати `cron/runs/<jobId>.jsonl` за розміром і кількістю рядків, які зберігаються.
    - Див. [Cron-завдання](/uk/automation/cron-jobs) для огляду можливостей і прикладів CLI.

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
    - Вважайте весь вміст payload hook/Webhook недовіреним входом.
    - Використовуйте окремий `hooks.token`; не використовуйте спільно Gateway token.
    - Автентифікація hook підтримує лише заголовки (`Authorization: Bearer ...` або `x-openclaw-token`); токени в query string відхиляються.
    - `hooks.path` не може бути `/`; залишайте вхід Webhook на окремому підшляху, наприклад `/hooks`.
    - Залишайте прапорці обходу небезпечного вмісту вимкненими (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), якщо не виконуєте вузькоспеціалізоване налагодження.
    - Якщо ви вмикаєте `hooks.allowRequestSessionKey`, також задайте `hooks.allowedSessionKeyPrefixes`, щоб обмежити ключі сесій, які може вибирати викликач.
    - Для агентів, керованих hooks, віддавайте перевагу сильним сучасним рівням моделей і суворій політиці інструментів (наприклад, лише обмін повідомленнями плюс sandboxing, де це можливо).

    Див. [повний довідник](/uk/gateway/configuration-reference#hooks) для всіх параметрів мапінгу та інтеграції Gmail.

  </Accordion>

  <Accordion title="Налаштувати маршрутизацію кількох агентів">
    Запускайте кілька ізольованих агентів з окремими workspace і сесіями:

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

    Див. [Кілька агентів](/uk/concepts/multi-agent) і [повний довідник](/uk/gateway/config-agents#multi-agent-routing) для правил binding і профілів доступу для кожного агента.

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

    - **Один файл**: замінює об’єкт, який його містить
    - **Масив файлів**: глибоко об’єднується по порядку (пізніший має пріоритет)
    - **Сусідні ключі**: об’єднуються після include (перевизначають включені значення)
    - **Вкладені include**: підтримуються до 10 рівнів вкладеності
    - **Відносні шляхи**: розв’язуються відносно файла, що включає
    - **Записи, якими керує OpenClaw**: коли запис змінює лише один розділ верхнього рівня,
      який підтримується include одного файла, наприклад `plugins: { $include: "./plugins.json5" }`,
      OpenClaw оновлює цей включений файл і залишає `openclaw.json` без змін
    - **Непідтримуваний запис через include**: кореневі include, масиви include та include
      із сусідніми перевизначеннями завершуються із закритою відмовою для записів, якими керує OpenClaw, замість
      сплощення конфігурації
    - **Обробка помилок**: зрозумілі помилки для відсутніх файлів, помилок парсингу та циклічних include

  </Accordion>
</AccordionGroup>

## Гаряче перезавантаження конфігурації

Gateway стежить за `~/.openclaw/openclaw.json` і автоматично застосовує зміни — ручний перезапуск для більшості налаштувань не потрібен.

Прямі редагування файла вважаються недовіреними, доки не пройдуть валідацію. Спостерігач
чекає, поки завершаться тимчасові записи/перейменування редактора, читає фінальний файл і відхиляє
некоректні зовнішні редагування, відновлюючи останню коректну конфігурацію. Записи конфігурації,
якими керує OpenClaw, використовують той самий бар’єр схеми перед записом; руйнівні пошкодження, як-от
видалення `gateway.mode` або зменшення файла більш ніж удвічі, відхиляються
і зберігаються як `.rejected.*` для перевірки.

Якщо ви бачите в журналах `Config auto-restored from last-known-good` або
`config reload restored last-known-good config`, перевірте відповідний файл
`.clobbered.*` поруч із `openclaw.json`, виправте відхилений payload, а потім виконайте
`openclaw config validate`. Див. [Усунення несправностей Gateway](/uk/gateway/troubleshooting#gateway-restored-last-known-good-config)
для контрольного списку відновлення.

### Режими перезавантаження

| Режим                  | Поведінка                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (типово)  | Миттєво застосовує безпечні зміни. Автоматично перезапускається для критичних.          |
| **`hot`**              | Застосовує лише безпечні зміни без перезапуску. Пише попередження, коли потрібен перезапуск — ви виконуєте його самі. |
| **`restart`**          | Перезапускає Gateway при будь-якій зміні конфігурації, безпечній чи ні.                 |
| **`off`**              | Вимикає спостереження за файлами. Зміни набирають чинності під час наступного ручного перезапуску. |

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
| Channels           | `channels.*`, `web` (WhatsApp) — усі вбудовані та Plugin channels | Ні                   |
| Agent & models     | `agent`, `agents`, `models`, `routing`                            | Ні                   |
| Automation         | `hooks`, `cron`, `agent.heartbeat`                                | Ні                   |
| Sessions & messages | `session`, `messages`                                            | Ні                   |
| Tools & media      | `tools`, `browser`, `skills`, `audio`, `talk`                     | Ні                   |
| UI & misc          | `ui`, `logging`, `identity`, `bindings`                           | Ні                   |
| Gateway server     | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Так**              |
| Infrastructure     | `discovery`, `canvasHost`, `plugins`                              | **Так**              |

<Note>
`gateway.reload` і `gateway.remote` — винятки; їх зміна **не** спричиняє перезапуск.
</Note>

### Планування перезавантаження

Коли ви редагуєте вихідний файл, на який є посилання через `$include`, OpenClaw планує
перезавантаження на основі макета, заданого в джерелі, а не сплощеного представлення в пам’яті.
Це робить рішення щодо гарячого перезавантаження (гаряче застосування чи перезапуск) передбачуваними навіть тоді, коли
один розділ верхнього рівня живе у власному включеному файлі, наприклад
`plugins: { $include: "./plugins.json5" }`. Планування перезавантаження завершується із закритою відмовою, якщо
макет джерела неоднозначний.

## RPC конфігурації (програмні оновлення)

Для інструментів, які записують конфігурацію через API gateway, віддавайте перевагу такому процесу:

- `config.schema.lookup` для перевірки одного піддерева (поверхневий вузол схеми + підсумки дочірніх елементів)
- `config.get` для отримання поточного знімка разом із `hash`
- `config.patch` для часткових оновлень (JSON merge patch: об’єкти об’єднуються, `null`
  видаляє, масиви замінюються)
- `config.apply` лише тоді, коли ви справді хочете замінити всю конфігурацію
- `update.run` для явного self-update з перезапуском

<Note>
Записи control-plane (`config.apply`, `config.patch`, `update.run`) мають
rate-limit: 3 запити на 60 секунд для кожного `deviceId+clientIp`. Запити на перезапуск
об’єднуються, а потім застосовують cooldown у 30 секунд між циклами перезапуску.
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
`note` і `restartDelayMs`. `baseHash` обов’язковий для обох методів, якщо
конфігурація вже існує.

## Змінні середовища

OpenClaw читає env vars із батьківського процесу, а також із:

- `.env` у поточному робочому каталозі (якщо присутній)
- `~/.openclaw/.env` (глобальний запасний варіант)

Жоден із цих файлів не перевизначає вже наявні env vars. Ви також можете задавати inline env vars у конфігурації:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Імпорт env із shell (необов’язково)">
  Якщо це ввімкнено і очікувані ключі не задано, OpenClaw запускає вашу login shell і імпортує лише відсутні ключі:

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
- Відсутні/порожні змінні спричиняють помилку під час завантаження
- Екрануйте через `$${VAR}` для літерального виводу
- Працює всередині файлів `$include`
- Inline-підстановка: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef (env, file, exec)">
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

Докладніше про SecretRef (включно з `secrets.providers` для `env`/`file`/`exec`) див. у [Керування секретами](/uk/gateway/secrets).
Підтримувані шляхи облікових даних наведено в [Поверхня облікових даних SecretRef](/uk/reference/secretref-credential-surface).
</Accordion>

Див. [Environment](/uk/help/environment) для повного порядку пріоритетів і джерел.

## Повний довідник

Повний довідник по полях див. у **[Довідник із конфігурації](/uk/gateway/configuration-reference)**.

---

_Пов’язане: [Приклади конфігурації](/uk/gateway/configuration-examples) · [Довідник із конфігурації](/uk/gateway/configuration-reference) · [Doctor](/uk/gateway/doctor)_

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Приклади конфігурації](/uk/gateway/configuration-examples)
- [Runbook Gateway](/uk/gateway)
