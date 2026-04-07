---
read_when:
    - OpenClaw не працює, і вам потрібен найшвидший шлях до виправлення
    - Ви хочете пройти процес тріажу перед зануренням у докладні інструкції
summary: Центр усунення несправностей OpenClaw зі швидкою діагностикою за симптомами
title: Загальне усунення несправностей
x-i18n:
    generated_at: "2026-04-07T14:58:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8abda90ef80234c2f91a51c5e1f2c004d4a4da12a5d5631b5927762550c6d5e3
    source_path: help/troubleshooting.md
    workflow: 15
---

# Усунення несправностей

Якщо у вас є лише 2 хвилини, використайте цю сторінку як початкову точку тріажу.

## Перші 60 секунд

Запустіть цю точну послідовність команд у вказаному порядку:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Хороший результат в одному рядку:

- `openclaw status` → показує налаштовані канали та відсутність явних помилок автентифікації.
- `openclaw status --all` → повний звіт наявний і ним можна поділитися.
- `openclaw gateway probe` → очікувана ціль gateway доступна (`Reachable: yes`). `RPC: limited - missing scope: operator.read` означає погіршену діагностику, а не збій підключення.
- `openclaw gateway status` → `Runtime: running` і `RPC probe: ok`.
- `openclaw doctor` → немає блокувальних помилок конфігурації/сервісу.
- `openclaw channels status --probe` → доступний gateway повертає живий стан транспорту для кожного облікового запису разом із результатами probe/audit, такими як `works` або `audit ok`; якщо gateway недоступний, команда повертається до зведень лише за конфігурацією.
- `openclaw logs --follow` → стабільна активність, без повторюваних фатальних помилок.

## 429 для довгого контексту Anthropic

Якщо ви бачите:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`,
перейдіть до [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/uk/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context).

## Локальний OpenAI-compatible backend працює напряму, але не працює в OpenClaw

Якщо ваш локальний або self-hosted backend `/v1` відповідає на малі прямі probe до
`/v1/chat/completions`, але завершується помилкою в `openclaw infer model run` або під час звичайних
ходів агента:

1. Якщо помилка згадує, що `messages[].content` має бути рядком, установіть
   `models.providers.<provider>.models[].compat.requiresStringContent: true`.
2. Якщо backend усе ще завершується помилкою лише під час ходів агента OpenClaw, установіть
   `models.providers.<provider>.models[].compat.supportsTools: false` і повторіть спробу.
3. Якщо крихітні прямі виклики все ще працюють, але більші запити OpenClaw аварійно завершують роботу
   backend, розглядайте решту проблеми як обмеження висхідної моделі/сервера та
   продовжуйте в докладній інструкції:
   [/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail](/uk/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail)

## Не вдається встановити plugin через відсутні openclaw extensions

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

Довідка: [Архітектура plugin](/uk/plugins/architecture)

## Дерево рішень

```mermaid
flowchart TD
  A[OpenClaw is not working] --> B{What breaks first}
  B --> C[No replies]
  B --> D[Dashboard or Control UI will not connect]
  B --> E[Gateway will not start or service not running]
  B --> F[Channel connects but messages do not flow]
  B --> G[Cron or heartbeat did not fire or did not deliver]
  B --> H[Node is paired but camera canvas screen exec fails]
  B --> I[Browser tool fails]

  C --> C1[/No replies section/]
  D --> D1[/Control UI section/]
  E --> E1[/Gateway section/]
  F --> F1[/Channel flow section/]
  G --> G1[/Automation section/]
  H --> H1[/Node tools section/]
  I --> I1[/Browser section/]
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

    Хороший результат виглядає так:

    - `Runtime: running`
    - `RPC probe: ok`
    - Ваш канал показує підключений транспорт і, де підтримується, `works` або `audit ok` у `channels status --probe`
    - Відправник позначений як схвалений (або для DM політика відкрита/allowlist)

    Поширені сигнатури в логах:

    - `drop guild message (mention required` → обмеження згадки заблокувало повідомлення в Discord.
    - `pairing request` → відправника не схвалено, і він очікує схвалення pairing у DM.
    - `blocked` / `allowlist` у логах каналу → відправник, кімната або група відфільтровані.

    Докладні сторінки:

    - [/gateway/troubleshooting#no-replies](/uk/gateway/troubleshooting#no-replies)
    - [/channels/troubleshooting](/uk/channels/troubleshooting)
    - [/channels/pairing](/uk/channels/pairing)

  </Accordion>

  <Accordion title="Dashboard або Control UI не підключаються">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Хороший результат виглядає так:

    - `Dashboard: http://...` показується в `openclaw gateway status`
    - `RPC probe: ok`
    - У логах немає циклу автентифікації

    Поширені сигнатури в логах:

    - `device identity required` → HTTP/незахищений контекст не може завершити автентифікацію пристрою.
    - `origin not allowed` → `Origin` браузера не дозволений для цілі gateway Control UI.
    - `AUTH_TOKEN_MISMATCH` із підказками повторної спроби (`canRetryWithDeviceToken=true`) → одна повторна спроба з довіреним токеном пристрою може відбутися автоматично.
    - Ця повторна спроба з кешованим токеном повторно використовує кешований набір scope, збережений разом із paired токеном пристрою. Виклики з явним `deviceToken` / явними `scopes` натомість зберігають запитаний ними набір scope.
    - В асинхронному шляху Tailscale Serve Control UI невдалі спроби для того самого `{scope, ip}` серіалізуються до того, як limiter зафіксує помилку, тому друга одночасна невдала повторна спроба вже може показати `retry later`.
    - `too many failed authentication attempts (retry later)` з браузерного джерела localhost → повторні невдалі спроби з того самого `Origin` тимчасово блокуються; інше джерело localhost використовує окремий bucket.
    - повторюване `unauthorized` після цієї повторної спроби → неправильний токен/пароль, невідповідність режиму автентифікації або застарілий paired токен пристрою.
    - `gateway connect failed:` → UI спрямовано на неправильний URL/порт або gateway недоступний.

    Докладні сторінки:

    - [/gateway/troubleshooting#dashboard-control-ui-connectivity](/uk/gateway/troubleshooting#dashboard-control-ui-connectivity)
    - [/web/control-ui](/web/control-ui)
    - [/gateway/authentication](/uk/gateway/authentication)

  </Accordion>

  <Accordion title="Gateway не запускається або сервіс встановлено, але він не працює">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw logs --follow
    openclaw doctor
    openclaw channels status --probe
    ```

    Хороший результат виглядає так:

    - `Service: ... (loaded)`
    - `Runtime: running`
    - `RPC probe: ok`

    Поширені сигнатури в логах:

    - `Gateway start blocked: set gateway.mode=local` або `existing config is missing gateway.mode` → режим gateway є remote, або у файлі конфігурації відсутня позначка локального режиму, і його слід виправити.
    - `refusing to bind gateway ... without auth` → прив’язування не до loopback без дійсного шляху автентифікації gateway (токен/пароль або trusted-proxy, якщо налаштовано).
    - `another gateway instance is already listening` або `EADDRINUSE` → порт уже зайнятий.

    Докладні сторінки:

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

    Хороший результат виглядає так:

    - Транспорт каналу підключено.
    - Перевірки pairing/allowlist проходять.
    - Згадки виявляються там, де це потрібно.

    Поширені сигнатури в логах:

    - `mention required` → обмеження згадки в групі заблокувало обробку.
    - `pairing` / `pending` → відправника DM ще не схвалено.
    - `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → проблема з токеном дозволів каналу.

    Докладні сторінки:

    - [/gateway/troubleshooting#channel-connected-messages-not-flowing](/uk/gateway/troubleshooting#channel-connected-messages-not-flowing)
    - [/channels/troubleshooting](/uk/channels/troubleshooting)

  </Accordion>

  <Accordion title="Cron або heartbeat не спрацювали чи не були доставлені">
    ```bash
    openclaw status
    openclaw gateway status
    openclaw cron status
    openclaw cron list
    openclaw cron runs --id <jobId> --limit 20
    openclaw logs --follow
    ```

    Хороший результат виглядає так:

    - `cron.status` показує, що cron увімкнено і є наступне пробудження.
    - `cron runs` показує нещодавні записи `ok`.
    - Heartbeat увімкнено і він не поза активними годинами.

    Поширені сигнатури в логах:

- `cron: scheduler disabled; jobs will not run automatically` → cron вимкнено.
- `heartbeat skipped` з `reason=quiet-hours` → поза налаштованими активними годинами.
- `heartbeat skipped` з `reason=empty-heartbeat-file` → `HEARTBEAT.md` існує, але містить лише порожній каркас або каркас лише із заголовками.
- `heartbeat skipped` з `reason=no-tasks-due` → у `HEARTBEAT.md` активний режим завдань, але ще не настав час для жодного з інтервалів завдань.
- `heartbeat skipped` з `reason=alerts-disabled` → усю видимість heartbeat вимкнено (`showOk`, `showAlerts` і `useIndicator` усі вимкнені).
- `requests-in-flight` → основна смуга зайнята; пробудження heartbeat було відкладено. - `unknown accountId` → цільовий account heartbeat для доставки не існує.

      Докладні сторінки:

      - [/gateway/troubleshooting#cron-and-heartbeat-delivery](/uk/gateway/troubleshooting#cron-and-heartbeat-delivery)
      - [/automation/cron-jobs#troubleshooting](/uk/automation/cron-jobs#troubleshooting)
      - [/gateway/heartbeat](/uk/gateway/heartbeat)

    </Accordion>

    <Accordion title="Node paired, але інструмент не працює: camera canvas screen exec">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw nodes status
      openclaw nodes describe --node <idOrNameOrIp>
      openclaw logs --follow
      ```

      Хороший результат виглядає так:

      - Node вказано як підключений і paired для ролі `node`.
      - Для команди, яку ви викликаєте, існує capability.
      - Для інструмента надано стан дозволу.

      Поширені сигнатури в логах:

      - `NODE_BACKGROUND_UNAVAILABLE` → переведіть застосунок node на передній план.
      - `*_PERMISSION_REQUIRED` → дозвіл ОС було відхилено або він відсутній.
      - `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec.
      - `SYSTEM_RUN_DENIED: allowlist miss` → команди немає в allowlist exec.

      Докладні сторінки:

      - [/gateway/troubleshooting#node-paired-tool-fails](/uk/gateway/troubleshooting#node-paired-tool-fails)
      - [/nodes/troubleshooting](/uk/nodes/troubleshooting)
      - [/tools/exec-approvals](/uk/tools/exec-approvals)

    </Accordion>

    <Accordion title="Exec раптово почав вимагати схвалення">
      ```bash
      openclaw config get tools.exec.host
      openclaw config get tools.exec.security
      openclaw config get tools.exec.ask
      openclaw gateway restart
      ```

      Що змінилося:

      - Якщо `tools.exec.host` не встановлено, значенням за замовчуванням є `auto`.
      - `host=auto` визначається як `sandbox`, коли активний runtime sandbox, інакше як `gateway`.
      - `host=auto` відповідає лише за маршрутизацію; поведінка "YOLO" без запиту визначається `security=full` разом із `ask=off` на gateway/node.
      - Для `gateway` і `node` невстановлений `tools.exec.security` за замовчуванням має значення `full`.
      - Невстановлений `tools.exec.ask` за замовчуванням має значення `off`.
      - Результат: якщо ви бачите схвалення, якась локальна для хоста або поточної сесії політика зробила exec суворішим порівняно з поточними значеннями за замовчуванням.

      Відновлення поточної поведінки за замовчуванням без схвалень:

      ```bash
      openclaw config set tools.exec.host gateway
      openclaw config set tools.exec.security full
      openclaw config set tools.exec.ask off
      openclaw gateway restart
      ```

      Безпечніші альтернативи:

      - Встановіть лише `tools.exec.host=gateway`, якщо вам просто потрібна стабільна маршрутизація на хості.
      - Використовуйте `security=allowlist` з `ask=on-miss`, якщо хочете exec на хості, але також хочете перевірку у разі промахів по allowlist.
      - Увімкніть режим sandbox, якщо хочете, щоб `host=auto` знову визначався як `sandbox`.

      Поширені сигнатури в логах:

      - `Approval required.` → команда очікує на `/approve ...`.
      - `SYSTEM_RUN_DENIED: approval required` → очікується схвалення exec на хості node.
      - `exec host=sandbox requires a sandbox runtime for this session` → неявно/явно вибрано sandbox, але режим sandbox вимкнено.

      Докладні сторінки:

      - [/tools/exec](/uk/tools/exec)
      - [/tools/exec-approvals](/uk/tools/exec-approvals)
      - [/gateway/security#runtime-expectation-drift](/uk/gateway/security#runtime-expectation-drift)

    </Accordion>

    <Accordion title="Не працює інструмент браузера">
      ```bash
      openclaw status
      openclaw gateway status
      openclaw browser status
      openclaw logs --follow
      openclaw doctor
      ```

      Хороший результат виглядає так:

      - Стан браузера показує `running: true` і вибраний браузер/профіль.
      - `openclaw` запускається, або `user` бачить локальні вкладки Chrome.

      Поширені сигнатури в логах:

      - `unknown command "browser"` або `unknown command 'browser'` → `plugins.allow` установлено, але воно не містить `browser`.
      - `Failed to start Chrome CDP on port` → не вдалося запустити локальний браузер Chrome CDP.
      - `browser.executablePath not found` → налаштований шлях до бінарного файла неправильний.
      - `browser.cdpUrl must be http(s) or ws(s)` → налаштований URL CDP використовує непідтримувану схему.
      - `browser.cdpUrl has invalid port` → налаштований URL CDP містить неправильний або позадіапазонний порт.
      - `No Chrome tabs found for profile="user"` → профіль приєднання Chrome MCP не має відкритих локальних вкладок Chrome.
      - `Remote CDP for profile "<name>" is not reachable` → налаштована віддалена кінцева точка CDP недоступна з цього хоста.
      - `Browser attachOnly is enabled ... not reachable` або `Browser attachOnly is enabled and CDP websocket ... is not reachable` → профіль attach-only не має живої цілі CDP.
      - застарілі перевизначення viewport / dark-mode / locale / offline у профілях attach-only або remote CDP → виконайте `openclaw browser stop --browser-profile <name>`, щоб закрити активну керовану сесію та скинути стан емуляції без перезапуску gateway.

      Докладні сторінки:

      - [/gateway/troubleshooting#browser-tool-fails](/uk/gateway/troubleshooting#browser-tool-fails)
      - [/tools/browser#missing-browser-command-or-tool](/uk/tools/browser#missing-browser-command-or-tool)
      - [/tools/browser-linux-troubleshooting](/uk/tools/browser-linux-troubleshooting)
      - [/tools/browser-wsl2-windows-remote-cdp-troubleshooting](/uk/tools/browser-wsl2-windows-remote-cdp-troubleshooting)

    </Accordion>
  </AccordionGroup>

## Пов’язані матеріали

- [FAQ](/uk/help/faq) — поширені запитання
- [Усунення несправностей gateway](/uk/gateway/troubleshooting) — проблеми, пов’язані з gateway
- [Doctor](/uk/gateway/doctor) — автоматичні перевірки стану та виправлення
- [Усунення несправностей каналів](/uk/channels/troubleshooting) — проблеми з підключенням каналів
- [Усунення несправностей автоматизації](/uk/automation/cron-jobs#troubleshooting) — проблеми з cron і heartbeat
