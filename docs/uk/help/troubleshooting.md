---
read_when:
    - OpenClaw не працює, і вам потрібен найшвидший шлях до виправлення проблеми
    - Ви хочете пройти шлях первинної діагностики, перш ніж занурюватися в детальні інструкції усунення неполадок
summary: Центр усунення неполадок OpenClaw за симптомами
title: Загальне усунення неполадок
x-i18n:
    generated_at: "2026-04-24T07:11:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: c832c3f7609c56a5461515ed0f693d2255310bf2d3958f69f57c482bcbef97f0
    source_path: help/troubleshooting.md
    workflow: 15
---

Якщо у вас є лише 2 хвилини, використовуйте цю сторінку як вхідну точку для первинної діагностики.

## Перші 60 секунд

Виконайте цю точну послідовність команд по порядку:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Ознаки коректного виводу в одному рядку:

- `openclaw status` → показує налаштовані канали й відсутність явних помилок автентифікації.
- `openclaw status --all` → повний звіт присутній і ним можна поділитися.
- `openclaw gateway probe` → очікувана ціль Gateway досяжна (`Reachable: yes`). `Capability: ...` показує, який рівень автентифікації вдалося підтвердити під час перевірки, а `Read probe: limited - missing scope: operator.read` означає погіршену діагностику, а не збій з’єднання.
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok` і правдоподібний рядок `Capability: ...`. Використайте `--require-rpc`, якщо вам також потрібне підтвердження RPC з областю читання.
- `openclaw doctor` → немає блокувальних помилок конфігурації чи сервісу.
- `openclaw channels status --probe` → досяжний Gateway повертає стан транспорту для кожного облікового запису в реальному часі, а також результати перевірки/аудиту, як-от `works` або `audit ok`; якщо Gateway недосяжний, команда повертається до зведень лише за конфігурацією.
- `openclaw logs --follow` → стабільна активність, без повторюваних критичних помилок.

## Anthropic long context 429

Якщо ви бачите:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
перейдіть до [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Локальний OpenAI-compatible backend працює напряму, але не працює в OpenClaw

Якщо ваш локальний або self-hosted бекенд `/v1` відповідає на невеликі прямі
перевірки `/v1/chat/completions`, але завершується помилкою під час `openclaw infer model run` або звичайних
ходів агента:

1. Якщо помилка згадує, що `messages[].content` очікує рядок, установіть
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Якщо бекенд усе ще збоїть лише під час ходів агента OpenClaw, установіть
   `models.providers.<provider>.models[].compat.supportsTools: false` і повторіть спробу.
3. Якщо крихітні прямі виклики все ще працюють, але більші запити OpenClaw аварійно зупиняють
   бекенд, розглядайте решту проблеми як обмеження моделі/сервера на боці апстриму і
   продовжуйте в детальній інструкції:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/uk/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## Установлення Plugin завершується помилкою через відсутність openclaw extensions

Якщо встановлення завершується помилкою `package.json missing openclaw.extensions`, пакет plugin
використовує стару структуру, яку OpenClaw більше не приймає.

Виправлення в пакеті plugin:

1. Додайте `openclaw.extensions` до `package.json`.
2. Спрямуйте записи на зібрані runtime-файли (зазвичай `./dist/index.js`).
3. Перевидайте plugin і знову виконайте `openclaw plugins install <package>`.

Приклад:

```json
{
  "name": "@openclaw/my-plugin",
  "version": "1.2.3",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

Довідка: [Архітектура Plugin](/uk/plugins/architecture)

## Дерево рішень

```mermaid
flowchart TD
  A[OpenClaw не працює] --> B{Що ламається першим}
  B --> C[Немає відповідей]
  B --> D[Dashboard або Control UI не підключається]
  B --> E[Gateway не запускається або сервіс не працює]
  B --> F[Канал підключається, але повідомлення не проходять]
  B --> G[Cron або Heartbeat не спрацював чи не доставив повідомлення]
  B --> H[Node спарений, але не працюють інструменти camera canvas screen exec]
  B --> I[Не працює інструмент browser]

  C --> C1[/Розділ «Немає відповідей»/]
  D --> D1[/Розділ «Control UI»/]
  E --> E1[/Розділ «Gateway»/]
  F --> F1[/Розділ «Потік каналу»/]
  G --> G1[/Розділ «Автоматизація»/]
  H --> H1[/Розділ «Інструменти Node»/]
  I --> I1[/Розділ «Browser»/]
```

<AccordionGroup>
  <Accordion title="Немає відповідей">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw channels status --probe
    openclaw pairing list --channel <channel> [--account <id>]
    openclaw logs --follow
    ```

    Ознаки коректного виводу:

    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` або `admin-capable`
    - Ваш канал показує підключений транспорт і, де підтримується, `works` або `audit ok` у `channels status --probe`
    - Відправник позначений як схвалений (або політика DM відкрита/є allowlist)

    Типові сигнатури в журналах:

    - `drop guild message (mention required` → фільтрація за згадками заблокувала повідомлення в Discord.
    - `pairing request` → відправник не схвалений і очікує схвалення спарювання в DM.
    - `blocked` / `allowlist` у журналах каналу → відправник, кімната або група відфільтровані.

    Детальні сторінки:

    - [/gateway/troubleshooting#no-replies](/uk/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/uk/channels/troubleshooting)
    - [/channels/pairing](/uk/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard або Control UI не підключається">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Ознаки коректного виводу:

    - `Dashboard: http://...` показується в `openclaw gateway status`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` або `admin-capable`
    - У журналах немає циклу автентифікації

    Типові сигнатури в журналах:

    - `device identity required` → HTTP/незахищений контекст не може завершити автентифікацію пристрою.
    - `origin not allowed` → `Origin` браузера не дозволений для цілі Gateway у Control UI.
    - `AUTH_TOKEN_MISMATCH` із підказками повторної спроби (`canRetryWithDeviceToken=true`) → може автоматично відбутися одна повторна спроба з довіреним токеном пристрою.
    - Ця повторна спроба з кешованим токеном повторно використовує кешований набір областей доступу, збережений разом зі спареним токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` натомість зберігають запитаний ними набір областей.
    - В асинхронному шляху Control UI через Tailscale Serve невдалі спроби для того самого
      `{scope, ip}` серіалізуються до того, як лімітер зафіксує невдачу, тому
      друга одночасна невдала повторна спроба вже може показати `retry later`.
    - `too many failed authentication attempts (retry later)` з браузерного localhost origin → повторні невдалі спроби з того самого `Origin` тимчасово блокуються; інший localhost origin використовує окремий bucket.
    - повторюване `unauthorized` після цієї повторної спроби → неправильний токен/пароль, невідповідність режиму автентифікації або застарілий токен спареного пристрою.
    - `gateway connect failed:` → UI націлений на неправильну URL-адресу/порт або на недосяжний Gateway.

    Детальні сторінки:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/uk/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/uk/web/control-ui)
    - [/gateway/authentication](/uk/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway не запускається або сервіс установлено, але він не працює">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Ознаки коректного виводу:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `Connectivity probe: ok`
    - `Capability: read-only`, `write-capable` або `admin-capable`

    Типові сигнатури в журналах:

    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → режим gateway є remote, або у файлі конфігурації відсутня позначка local-mode, і його слід виправити.
    - `refusing to bind gateway ... without auth` → прив’язка не до loopback без чинного шляху автентифікації gateway (токен/пароль або trusted-proxy, якщо налаштовано).
    - `another gateway instance is already listening` або `EADDRINUSE` → порт уже зайнятий.

    Детальні сторінки:

    - [/gateway/troubleshooting#gateway-service-not-running](/uk/gateway/troubleshooting#gateway-service-not-running)
    - [/gateway/background-process](/uk/gateway/background-process)
    - [/gateway/configuration](/uk/gateway/configuration)

  </Accordion>

  <Accordion title="Канал підключається, але повідомлення не проходять">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Ознаки коректного виводу:

    - Транспорт каналу підключений.
    - Перевірки pairing/allowlist проходять успішно.
    - Згадки виявляються там, де це потрібно.

    Типові сигнатури в журналах:

    - `mention required` → фільтрація групових згадок заблокувала обробку.
    - `pairing` / `pending` → відправник DM ще не схвалений.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → проблема з токеном дозволів каналу.

    Детальні сторінки:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/uk/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/uk/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron або Heartbeat не спрацював чи не доставив повідомлення">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Ознаки коректного виводу:

    - `cron.status` показує, що функцію ввімкнено і є час наступного пробудження.
    - `cron runs` показує нещодавні записи `ok`.
    - Heartbeat увімкнено й він не поза активними годинами.

    Типові сигнатури в журналах:

    - `cron: scheduler disabled; jobs will not run automatically` → cron вимкнено.
    - `heartbeat skipped` з `reason=quiet-hours` → поза налаштованими активними годинами.
    - `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожній каркас або лише заголовки.
    - `heartbeat skipped` з `reason=no-tasks-due` → у `HEARTBEAT.md` активний режим завдань, але для жодного з інтервалів завдань ще не настав час.
    - `heartbeat skipped` з `reason=alerts-disabled` → уся видимість Heartbeat вимкнена (`showOk`, `showAlerts` і `useIndicator` усі вимкнені).
    - `requests-in-flight` → основна смуга зайнята; пробудження heartbeat було відкладене.
    - `unknown accountId` → цільовий обліковий запис доставки heartbeat не існує.

    Детальні сторінки:

    - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/uk/gateway/troubleshooting#cron-and-heartbeat-delivery)
    - [/automation/cron-jobs#troubleshooting](/uk/automation/cron-jobs#troubleshooting)
    - [/gateway/heartbeat](/uk/gateway/heartbeat)

  </Accordion>

  <Accordion title="Node спарений, але інструмент не працює: camera canvas screen exec">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw nodes status
    openclaw nodes describe --node <idOrNameOrIp>
    openclaw logs --follow
    ```

    Ознаки коректного виводу:

    - Node указано як підключений і спарений для ролі `node`.
    - Для команди, яку ви викликаєте, існує відповідна capability.
    - Для інструмента надано стан дозволу.

    Типові сигнатури в журналах:

    - `NODE_BACKGROUND_UNAVAILABLE` → переведіть застосунок node на передній план.
    - `*_PERMISSION_REQUIRED` → дозвіл ОС було відхилено або він відсутній.
    - `SYSTEM_RUN_DENIED: approval required` → схвалення exec очікує надання.
    - `SYSTEM_RUN_DENIED: allowlist miss` → команда відсутня в allowlist для exec.

    Детальні сторінки:

    - [/gateway/troubleshooting#node-paired-tool-fails](/uk/gateway/troubleshooting#node-paired-tool-fails)
    - [/nodes/troubleshooting](/uk/nodes/troubleshooting)
    - [/tools/exec-approvals](/uk/tools/exec-approvals)

  </Accordion>

  <Accordion title="Exec раптово почав запитувати схвалення">
    ```bash
    openclaw config get tools.exec.host
    openclaw config get tools.exec.security
    openclaw config get tools.exec.ask
    openclaw gateway restart
    ```

    Що змінилося:

    - Якщо `tools.exec.host` не задано, значенням за замовчуванням є `auto`.
    - `host=auto` визначається як `sandbox`, коли активне sandbox runtime, і як `gateway` — у протилежному випадку.
    - `host=auto` відповідає лише за маршрутизацію; поведінка "YOLO" без запиту підтвердження походить від `security=full` разом із `ask=off` на gateway/node.
    - Для `gateway` і `node`, якщо `tools.exec.security` не задано, значенням за замовчуванням є `full`.
    - Якщо `tools.exec.ask` не задано, значенням за замовчуванням є `off`.
    - Результат: якщо ви бачите запити на схвалення, значить якась локальна для хоста або поточної сесії політика зробила exec суворішим порівняно з поточними значеннями за замовчуванням.

    Відновіть поточну поведінку за замовчуванням без схвалення:

    ```bash
    openclaw config set tools.exec.host gateway
    openclaw config set tools.exec.security full
    openclaw config set tools.exec.ask off
    openclaw gateway restart
    ```

    Безпечніші альтернативи:

    - Установіть лише `tools.exec.host=gateway`, якщо вам потрібна просто стабільна маршрутизація хоста.
    - Використайте `security=allowlist` разом із `ask=on-miss`, якщо ви хочете exec на хості, але при цьому хочете перевірку в разі промахів по allowlist.
    - Увімкніть режим sandbox, якщо хочете, щоб `host=auto` знову визначався як `sandbox`.

    Типові сигнатури в журналах:

    - `Approval required.` → команда очікує на `/approve ...`.
    - `SYSTEM_RUN_DENIED: approval required` → очікує схвалення exec на хості node.
    - `exec host=sandbox requires a sandbox runtime for this session` → неявно/явно вибрано sandbox, але режим sandbox вимкнено.

    Детальні сторінки:

    - [/tools/exec](/uk/tools/exec)
    - [/tools/exec-approvals](/uk/tools/exec-approvals)
    - [/gateway/security#what-the-audit-checks-high-level](/uk/gateway/security#what-the-audit-checks-high-level)

  </Accordion>

  <Accordion title="Інструмент browser не працює">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw browser status
    openclaw logs --follow
    openclaw doctor
    ```

    Ознаки коректного виводу:

    - Статус browser показує `running: true` і вибраний browser/profile.
    - `openclaw` запускається, або `user` може бачити локальні вкладки Chrome.

    Типові сигнатури в журналах:

    - `unknown command "browser"` або `unknown command 'browser'` → установлено `plugins.allow`, і воно не містить `browser`.
    - `Failed to start Chrome CDP on port` → не вдалося запустити локальний browser.
    - `browser.executablePath not found` → налаштований шлях до бінарного файла неправильний.
    - `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему.
    - `browser.cdpUrl has invalid port` → налаштований URL CDP має некоректний або неприпустимий порт.
    - `No Chrome tabs found for profile="user"` → профіль підключення Chrome MCP не має відкритих локальних вкладок Chrome.
    - `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена кінцева точка CDP недосяжна з цього хоста.
    - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль attach-only не має живої цілі CDP.
    - застарілі перевизначення viewport / dark-mode / locale / offline на профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну керівну сесію та скинути стан емуляції без перезапуску gateway.

    Детальні сторінки:

    - [/gateway/troubleshooting#browser-tool-fails](/uk/gateway/troubleshooting#browser-tool-fails)
    - [/tools/browser#missing-browser-command-or-tool](/uk/tools/browser#missing-browser-command-or-tool)
    - [/tools/browser-linux-troubleshooting](/uk/tools/browser-linux-troubleshooting)
    - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

  </Accordion>

</AccordionGroup>

## Пов’язане

- [FAQ](/uk/help/faq) — часті запитання
- [Усунення неполадок Gateway](/uk/gateway/troubleshooting) — проблеми, пов’язані з gateway
- [Doctor](/uk/gateway/doctor) — автоматизовані перевірки стану та виправлення
- [Усунення неполадок каналів](/uk/channels/troubleshooting) — проблеми з підключенням каналів
- [Усунення неполадок автоматизації](/uk/automation/cron-jobs#troubleshooting) — проблеми з cron і Heartbeat
