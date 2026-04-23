---
read_when:
    - Вам потрібен детальний опис поведінки `openclaw onboard`
    - Ви налагоджуєте результати початкового налаштування або інтегруєте клієнти початкового налаштування
sidebarTitle: CLI reference
summary: Повна довідка щодо потоку налаштування CLI, налаштування автентифікації/моделі, виводів і внутрішньої будови
title: Довідка з налаштування CLI
x-i18n:
    generated_at: "2026-04-23T23:06:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: e4b9377e84a6f8063f20a80fe08b5ea2eccdd5b329ec8dfd9d16cbf425d01f66
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Ця сторінка — повна довідка для `openclaw onboard`.
Короткий посібник див. у [Onboarding (CLI)](/uk/start/wizard).

## Що робить майстер

Локальний режим (типовий) проводить вас через:

- Налаштування моделі й автентифікації (OAuth підписки OpenAI Code, Anthropic Claude CLI або API-ключ, а також MiniMax, GLM, Ollama, Moonshot, StepFun і варіанти AI Gateway)
- Розташування робочого простору та bootstrap-файли
- Налаштування Gateway (порт, bind, auth, tailscale)
- Канали та provider (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles та інші комплектні channel-plugin)
- Установлення демона (LaunchAgent, user unit systemd або нативне завдання Windows Scheduled Task із резервним варіантом через папку Startup)
- Перевірку стану
- Налаштування Skills

Віддалений режим налаштовує цю машину для підключення до gateway в іншому місці.
Він не встановлює і не змінює нічого на віддаленому хості.

## Докладно про локальний потік

<Steps>
  <Step title="Виявлення наявної конфігурації">
    - Якщо існує `~/.openclaw/openclaw.json`, виберіть Keep, Modify або Reset.
    - Повторний запуск майстра нічого не стирає, якщо ви явно не виберете Reset (або не передасте `--reset`).
    - CLI `--reset` за замовчуванням означає `config+creds+sessions`; використовуйте `--reset-scope full`, щоб також видалити робочий простір.
    - Якщо конфігурація недійсна або містить застарілі ключі, майстер зупиняється й просить вас запустити `openclaw doctor`, перш ніж продовжити.
    - Reset використовує `trash` і пропонує області дії:
      - Лише конфігурація
      - Конфігурація + облікові дані + сесії
      - Повне скидання (також видаляє робочий простір)
  </Step>
  <Step title="Модель і автентифікація">
    - Повна матриця варіантів наведена в [Параметри автентифікації та моделі](#auth-and-model-options).
  </Step>
  <Step title="Робочий простір">
    - Типово `~/.openclaw/workspace` (можна налаштувати).
    - Заповнює файли робочого простору, потрібні для bootstrap-ритуалу першого запуску.
    - Структура робочого простору: [Робочий простір агента](/uk/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Запитує порт, bind, режим auth і відкриття через tailscale.
    - Рекомендовано: залишати token auth увімкненим навіть для loopback, щоб локальні WS-клієнти мали проходити автентифікацію.
    - У режимі token інтерактивне налаштування пропонує:
      - **Generate/store plaintext token** (типово)
      - **Use SecretRef** (за бажанням)
    - У режимі password інтерактивне налаштування також підтримує збереження plaintext або SecretRef.
    - Неінтерактивний шлях SecretRef для token: `--gateway-token-ref-env <ENV_VAR>`.
      - Потребує непорожньої env-змінної в середовищі процесу initial setup.
      - Не можна поєднувати з `--gateway-token`.
    - Вимикайте auth лише якщо повністю довіряєте кожному локальному процесу.
    - Bind, відмінний від loopback, усе одно потребує auth.
  </Step>
  <Step title="Канали">
    - [WhatsApp](/uk/channels/whatsapp): необов’язковий вхід через QR
    - [Telegram](/uk/channels/telegram): token бота
    - [Discord](/uk/channels/discord): token бота
    - [Google Chat](/uk/channels/googlechat): JSON service account + аудиторія webhook
    - [Mattermost](/uk/channels/mattermost): token бота + base URL
    - [Signal](/uk/channels/signal): необов’язкове встановлення `signal-cli` + конфігурація облікового запису
    - [BlueBubbles](/uk/channels/bluebubbles): рекомендовано для iMessage; URL сервера + password + webhook
    - [iMessage](/uk/channels/imessage): застарілий шлях до CLI `imsg` + доступ до БД
    - Безпека DM: типово використовується pairing. Перший DM надсилає код; підтвердіть через
      `openclaw pairing approve <channel> <code>` або використовуйте allowlist.
  </Step>
  <Step title="Установлення демона">
    - macOS: LaunchAgent
      - Потребує активної сесії користувача; для headless використовуйте власний LaunchDaemon (не постачається).
    - Linux і Windows через WSL2: user unit systemd
      - Майстер намагається виконати `loginctl enable-linger <user>`, щоб gateway продовжував працювати після виходу з системи.
      - Може попросити sudo (записує в `/var/lib/systemd/linger`); спочатку пробує без sudo.
    - Нативна Windows: спочатку Scheduled Task
      - Якщо створення завдання заборонено, OpenClaw повертається до login item у папці Startup для поточного користувача й одразу запускає gateway.
      - Scheduled Tasks залишаються пріоритетними, оскільки дають кращий статус supervisor.
    - Вибір runtime: Node (рекомендовано; обов’язково для WhatsApp і Telegram). Bun не рекомендується.
  </Step>
  <Step title="Перевірка стану">
    - Запускає gateway (за потреби) і виконує `openclaw health`.
    - `openclaw status --deep` додає live-перевірку стану gateway до виводу status, зокрема channel-probes, коли вони підтримуються.
  </Step>
  <Step title="Skills">
    - Зчитує доступні Skills і перевіряє вимоги.
    - Дозволяє вибрати менеджер node: npm, pnpm або bun.
    - Установлює необов’язкові залежності (деякі використовують Homebrew на macOS).
  </Step>
  <Step title="Завершення">
    - Підсумок і наступні кроки, зокрема варіанти для застосунків iOS, Android і macOS.
  </Step>
</Steps>

<Note>
Якщо GUI не виявлено, майстер виводить інструкції з перенаправлення SSH-порту для Control UI замість відкриття браузера.
Якщо ресурси Control UI відсутні, майстер намагається їх зібрати; резервний варіант — `pnpm ui:build` (автоматично встановлює UI-залежності).
</Note>

## Докладно про віддалений режим

Віддалений режим налаштовує цю машину для підключення до gateway в іншому місці.

<Info>
Віддалений режим не встановлює й не змінює нічого на віддаленому хості.
</Info>

Що ви задаєте:

- URL віддаленого gateway (`ws://...`)
- Token, якщо для віддаленого gateway потрібна auth (рекомендовано)

<Note>
- Якщо gateway доступний лише через loopback, використовуйте тунелювання SSH або tailnet.
- Підказки для виявлення:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Параметри автентифікації та моделі

<AccordionGroup>
  <Accordion title="API-ключ Anthropic">
    Використовує `ANTHROPIC_API_KEY`, якщо він є, або запитує ключ, а потім зберігає його для використання демоном.
  </Accordion>
  <Accordion title="Підписка OpenAI Code (OAuth)">
    Потік через браузер; вставте `code#state`.

    Установлює `agents.defaults.model` в `openai-codex/gpt-5.5`, якщо модель не задано або вона вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="Підписка OpenAI Code (device pairing)">
    Потік pairing через браузер із короткоживучим кодом пристрою.

    Установлює `agents.defaults.model` в `openai-codex/gpt-5.5`, якщо модель не задано або вона вже належить до сімейства OpenAI.

  </Accordion>
  <Accordion title="API-ключ OpenAI">
    Використовує `OPENAI_API_KEY`, якщо він є, або запитує ключ, а потім зберігає облікові дані в auth profiles.

    Установлює `agents.defaults.model` в `openai/gpt-5.4`, якщо модель не задано, має вигляд `openai/*` або `openai-codex/*`.

  </Accordion>
  <Accordion title="API-ключ xAI (Grok)">
    Запитує `XAI_API_KEY` і налаштовує xAI як provider моделей.
  </Accordion>
  <Accordion title="OpenCode">
    Запитує `OPENCODE_API_KEY` (або `OPENCODE_ZEN_API_KEY`) і дозволяє вибрати каталог Zen або Go.
    URL налаштування: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API-ключ (узагальнений)">
    Зберігає ключ за вас.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Запитує `AI_GATEWAY_API_KEY`.
    Докладніше: [Vercel AI Gateway](/uk/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Запитує account ID, gateway ID і `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Докладніше: [Cloudflare AI Gateway](/uk/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    Конфігурація записується автоматично. Hosted-значення за замовчуванням — `MiniMax-M2.7`; налаштування через API-ключ використовує
    `minimax/...`, а налаштування через OAuth — `minimax-portal/...`.
    Докладніше: [MiniMax](/uk/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    Конфігурація автоматично записується для стандартного StepFun або Step Plan на ендпоїнтах China чи global.
    Стандартний варіант наразі містить `step-3.5-flash`, а Step Plan також містить `step-3.5-flash-2603`.
    Докладніше: [StepFun](/uk/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (сумісний з Anthropic)">
    Запитує `SYNTHETIC_API_KEY`.
    Докладніше: [Synthetic](/uk/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud і локальні відкриті моделі)">
    Спочатку запитує `Cloud + Local`, `Cloud only` або `Local only`.
    `Cloud only` використовує `OLLAMA_API_KEY` з `https://ollama.com`.
    Режими з прив’язкою до хоста запитують base URL (типово `http://127.0.0.1:11434`), виявляють доступні моделі та пропонують значення за замовчуванням.
    `Cloud + Local` також перевіряє, чи цей хост Ollama виконав вхід для cloud-доступу.
    Докладніше: [Ollama](/uk/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot і Kimi Coding">
    Конфігурації Moonshot (Kimi K2) і Kimi Coding записуються автоматично.
    Докладніше: [Moonshot AI (Kimi + Kimi Coding)](/uk/providers/moonshot).
  </Accordion>
  <Accordion title="Користувацький provider">
    Працює з ендпоїнтами, сумісними з OpenAI і Anthropic.

    Інтерактивне initial setup підтримує ті самі варіанти зберігання API-ключа, що й інші потоки API-ключів provider:
    - **Paste API key now** (plaintext)
    - **Use secret reference** (env ref або налаштований provider ref, із preflight-перевіркою)

    Неінтерактивні прапорці:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (необов’язково; резервно використовує `CUSTOM_API_KEY`)
    - `--custom-provider-id` (необов’язково)
    - `--custom-compatibility <openai|anthropic>` (необов’язково; типово `openai`)

  </Accordion>
  <Accordion title="Пропустити">
    Залишає автентифікацію неналаштованою.
  </Accordion>
</AccordionGroup>

Поведінка моделей:

- Виберіть типову модель із виявлених варіантів або вручну введіть provider і модель.
- Коли initial setup починається з вибору auth provider, засіб вибору моделі автоматично віддає
  перевагу цьому provider. Для Volcengine і BytePlus така сама перевага
  також охоплює їхні coding-plan варіанти (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Якщо такий фільтр preferred-provider дав би порожній результат, засіб вибору повертається до
  повного каталогу замість того, щоб не показувати жодної моделі.
- Майстер виконує перевірку моделі та попереджає, якщо налаштована модель невідома або для неї бракує auth.

Шляхи облікових даних і профілів:

- Auth profiles (API-ключі + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Імпорт застарілого OAuth: `~/.openclaw/credentials/oauth.json`

Режим зберігання облікових даних:

- Типова поведінка initial setup зберігає API-ключі як plaintext-значення в auth profiles.
- `--secret-input-mode ref` вмикає режим посилань замість зберігання plaintext-ключів.
  В інтерактивному налаштуванні можна вибрати:
  - посилання на env-змінну (наприклад, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - посилання на налаштований provider (`file` або `exec`) з alias provider + id
- Інтерактивний режим посилань виконує швидку preflight-перевірку перед збереженням.
  - Env refs: перевіряє ім’я змінної та непорожнє значення в поточному середовищі initial setup.
  - Provider refs: перевіряє конфігурацію provider і розв’язує запитаний id.
  - Якщо preflight-перевірка не проходить, initial setup показує помилку й дозволяє повторити спробу.
- У неінтерактивному режимі `--secret-input-mode ref` підтримує лише env-backed варіант.
  - Задайте env-змінну provider у середовищі процесу initial setup.
  - Inline-прапорці ключів (наприклад, `--openai-api-key`) вимагають, щоб цю env-змінну було задано; інакше initial setup одразу завершується помилкою.
  - Для користувацьких provider неінтерактивний режим `ref` зберігає `models.providers.<id>.apiKey` як `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - У такому випадку для custom-provider `--custom-api-key` вимагає, щоб було задано `CUSTOM_API_KEY`; інакше initial setup одразу завершується помилкою.
- Облікові дані auth Gateway підтримують вибір plaintext і SecretRef в інтерактивному налаштуванні:
  - Режим token: **Generate/store plaintext token** (типово) або **Use SecretRef**.
  - Режим password: plaintext або SecretRef.
- Неінтерактивний шлях SecretRef для token: `--gateway-token-ref-env <ENV_VAR>`.
- Наявні plaintext-конфігурації продовжують працювати без змін.

<Note>
Порада для headless і серверів: завершіть OAuth на машині з браузером, а потім скопіюйте
`auth-profiles.json` цього агента (наприклад,
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json` або відповідний
шлях `$OPENCLAW_STATE_DIR/...`) на хост gateway. `credentials/oauth.json`
є лише застарілим джерелом імпорту.
</Note>

## Виводи й внутрішня будова

Типові поля в `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (якщо вибрано Minimax)
- `tools.profile` (локальне initial setup за замовчуванням встановлює `"coding"`, якщо значення не задано; наявні явні значення зберігаються)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (локальне initial setup за замовчуванням встановлює `per-channel-peer`, якщо значення не задано; наявні явні значення зберігаються)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Channel allowlist (Slack, Discord, Matrix, Microsoft Teams), якщо ви ввімкнете це під час prompt (імена за можливості розв’язуються в ID)
- `skills.install.nodeManager`
  - Прапорець `setup --node-manager` приймає `npm`, `pnpm` або `bun`.
  - У ручній конфігурації пізніше все ще можна встановити `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` записує `agents.list[]` і необов’язкові `bindings`.

Облікові дані WhatsApp зберігаються в `~/.openclaw/credentials/whatsapp/<accountId>/`.
Сесії зберігаються в `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Деякі канали постачаються як plugin. Якщо їх вибрано під час налаштування, майстер
запропонує встановити plugin (npm або локальний шлях) перед конфігурацією каналу.
</Note>

Wizard RPC Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Клієнти (застосунок macOS і Control UI) можуть відображати кроки, не перевпроваджуючи логіку initial setup.

Поведінка налаштування Signal:

- Завантажує відповідний release-артефакт
- Зберігає його в `~/.openclaw/tools/signal-cli/<version>/`
- Записує `channels.signal.cliPath` у конфігурацію
- JVM-збірки потребують Java 21
- За наявності використовуються нативні збірки
- Windows використовує WSL2 і дотримується потоку Linux signal-cli всередині WSL

## Пов’язані документи

- Центр initial setup: [Onboarding (CLI)](/uk/start/wizard)
- Автоматизація та скрипти: [CLI Automation](/uk/start/wizard-cli-automation)
- Довідка по команді: [`openclaw onboard`](/uk/cli/onboard)
